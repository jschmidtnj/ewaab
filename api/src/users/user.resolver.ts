import { verifyLoggedIn } from '../auth/checkAuth';
import { Resolver, Ctx, Query, ResolverInterface, FieldResolver, Root, Args } from 'type-graphql';
import { GraphQLContext } from '../utils/context';
import User from '../schema/users/user.entity';
import { getRepository } from 'typeorm';
import MessageGroup from '../schema/users/messageGroup.entity';
import { getMessageGroups, MessageGroupsArgs } from '../messages/messageGroups.resolver';
import Notification from '../schema/users/notification.entity';
import { getNotifications, NotificationsArgs } from './notifications';

@Resolver(_of => User)
class UserResolvers implements ResolverInterface<User> {
  @Query(_type => User, { description: 'user data' })
  async user(@Ctx() ctx: GraphQLContext): Promise<User> {
    if (!verifyLoggedIn(ctx)) {
      throw new Error('user not logged in');
    }
    if (!ctx.auth) {
      throw new Error('cannot find auth');
    }
    const UserModel = getRepository(User);
    const user = await UserModel.findOne(ctx.auth.id);
    if (!user) {
      throw new Error(`cannot find user with id ${ctx.auth.id}`);
    }
    return user;
  }

  @FieldResolver()
  async activeMessageGroups(@Root() user: User, @Args() args: MessageGroupsArgs): Promise<MessageGroup[]> {
    return await getMessageGroups(args, user.id);
  }

  @FieldResolver()
  async notifications(@Root() user: User, @Args() args: NotificationsArgs): Promise<Notification[]> {
    return await getNotifications(args, user.id);
  }
}

export default UserResolvers;
