// TODO - create and delete notifications (after elapsed time)
// create subscription to notifications

import { Matches } from "class-validator";
import { ArgsType, ResolverFilterData, Root, Subscription, Resolver, Field, Mutation, Args, Ctx } from "type-graphql";
import { getRepository } from "typeorm";
import { checkNotificationAccess, verifyLoggedIn } from "../auth/checkAuth";
import Notification from "../schema/users/notification.entity";
import { PaginationArgs } from "../schema/utils/pagination";
import { uuidRegex } from "../shared/variables";
import { GraphQLContext } from "../utils/context";
import { deleteNotificationQueue } from "../utils/redis";
import { defaultDBCache, notificationTopic } from "../utils/variables";

const expiresIn = 7; // days

@ArgsType()
export class NotificationsArgs extends PaginationArgs {
  // body
}

export const getNotifications = async (args: NotificationsArgs, userID: string):
  Promise<Notification[]> => {
  const NotificationModel = getRepository(Notification);
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

export const addNotification = async (message: string): Promise<void> => {
  const NotificationModel = getRepository(Notification);
  const now = new Date();
  const expires = new Date()
  expires.setDate(now.getDate() + expiresIn);
  const notificationData = await NotificationModel.create({
    created: now.getTime(),
    expires: expires.getTime(),
    message,
    viewed: false,
    // TODO - finish this
  });
  deleteNotificationQueue.add(notificationData.id, {
    delay: expires.getTime()
  })
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
  const NotificationModel = getRepository(Notification);
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
    filter: ({ payload, context }: ResolverFilterData<Notification, any, GraphQLContext>): boolean => {
      return context.auth !== undefined && payload.user === context.auth.id;
    }
  })
  notifications(@Root() notification: Notification): Notification {
    return notification;
  }

  @Mutation(_returns => String)
  async deleteNotification(@Args() args: DeleteArgs, @Ctx() ctx: GraphQLContext): Promise<string> {
    if (!verifyLoggedIn(ctx) || !ctx.auth) {
      throw new Error('cannot find auth data');
    }
    const NotificationModel = getRepository(Notification);
    const notification = await NotificationModel.findOne(args.id);
    if (!notification) {
      throw new Error(`cannot find notification with id ${args.id}`);
    }
    if (notification.user !== args.id) {
      throw new Error(`notification with id ${args.id} is not for current user`);
    }
    await deleteNotification(args);

    return `deleted notification with id ${args.id}`;
  }

  async markNotificationRead(@Args() args: MarkReadArgs, @Ctx() ctx: GraphQLContext): Promise<string> {
    if (!(await checkNotificationAccess({
      ctx,
      id: args.id
    }))) {
      throw new Error(`current user ${ctx.auth!.id} does not have access to mark notification as read`);
    }
    const NotificationModel = getRepository(Notification);
    await NotificationModel.update({
      id: args.id
    }, {
      viewed: true
    });
    return `marked notification ${args.id} as read`
  }
}

export default NotificationsResolver;
