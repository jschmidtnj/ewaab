import { Matches } from 'class-validator';
import { ArgsType, ResolverFilterData, Root, Subscription, Resolver, Field, Mutation, Args, Ctx } from 'type-graphql';
import { getRepository } from 'typeorm';
import { AuthAccessType, checkNotificationAccess } from '../auth/checkAuth';
import Notification, { NotificationType } from '../schema/users/notification.entity';
import User from '../schema/users/user.entity';
import { PaginationArgs } from '../schema/utils/pagination';
import { uuidRegex } from '../shared/variables';
import { GraphQLContext, SubscriptionContext } from '../utils/context';
import { deleteNotificationQueue } from '../utils/redis';
import { defaultDBCache, notificationTopic } from '../utils/variables';
import { connectionName } from '../db/connect';

const expiresIn = 7; // days

@ArgsType()
export class NotificationsArgs extends PaginationArgs {
  // body
}

export const getNotifications = async (args: NotificationsArgs, userID: string):
  Promise<Notification[]> => {
  const NotificationModel = getRepository(Notification, connectionName);
  const data = await NotificationModel.find({
    where: {
      user: userID
    },
    take: args.perpage,
    skip: args.page * args.perpage,
    cache: defaultDBCache
  });
  return data;
};

@ArgsType()
class AddNotificationArgs {
  @Field(_type => String, { description: 'message content' })
  message: string;
}

export const addNotification = async (args: AddNotificationArgs, user: string, type: NotificationType): Promise<void> => {
  const NotificationModel = getRepository(Notification, connectionName);
  const now = new Date();
  const expires = new Date();
  expires.setDate(now.getDate() + expiresIn);
  const notificationData = await NotificationModel.save({
    created: now.getTime(),
    expires: expires.getTime(),
    message: args.message,
    viewed: false,
    user,
    type
  });
  deleteNotificationQueue.add(notificationData.id, {
    delay: expires.getTime()
  });
};

@ArgsType()
class DeleteArgs {
  @Field(_type => String, { description: 'notification id' })
  @Matches(uuidRegex, {
    message: 'invalid notification id provided, must be uuid v4'
  })
  id: string;
}

export const deleteNotification = async (args: DeleteArgs): Promise<void> => {
  const NotificationModel = getRepository(Notification, connectionName);
  await NotificationModel.delete(args.id);
};

@ArgsType()
class MarkReadArgs {
  @Field(_type => String, { description: 'notification id' })
  @Matches(uuidRegex, {
    message: 'invalid notification id provided, must be uuid v4'
  })
  id: string;
}

@Resolver()
class NotificationsResolver {
  @Subscription(_returns => Notification, {
    topics: notificationTopic,
    filter: ({ payload, context }: ResolverFilterData<Notification, undefined, SubscriptionContext>): boolean => {
      return context.auth !== undefined && payload.user === context.auth.id;
    }
  })
  notifications(@Root() notification: Notification): Notification {
    return notification;
  }

  @Mutation(_returns => String)
  async sendGlobalNotification(@Args() args: AddNotificationArgs, @Ctx() ctx: GraphQLContext): Promise<string> {
    if (!(await checkNotificationAccess({
      ctx,
      accessType: AuthAccessType.modify
    }))) {
      throw new Error('current user does not have access to send new global notification');
    }
    const UserModel = getRepository(User, connectionName);
    for (const user of await UserModel.find({
      select: ['id']
    })) {
      await addNotification(args, user.id, NotificationType.admin);
    }
    return 'sent global notification';
  }

  @Mutation(_returns => String)
  async deleteNotification(@Args() args: DeleteArgs, @Ctx() ctx: GraphQLContext): Promise<string> {
    if (!(await checkNotificationAccess({
      ctx,
      id: args.id,
      accessType: AuthAccessType.modify
    }))) {
      throw new Error(`current user does not have access to delete notification ${args.id}`);
    }
    await deleteNotification(args);

    return `deleted notification with id ${args.id}`;
  }

  async markNotificationRead(@Args() args: MarkReadArgs, @Ctx() ctx: GraphQLContext): Promise<string> {
    if (!(await checkNotificationAccess({
      ctx,
      id: args.id,
      accessType: AuthAccessType.view
    }))) {
      throw new Error(`current user does not have access to mark notification ${args.id} as read`);
    }
    const NotificationModel = getRepository(Notification, connectionName);
    await NotificationModel.update({
      id: args.id
    }, {
      viewed: true
    });
    return `marked notification ${args.id} as read`;
  }
}

export default NotificationsResolver;
