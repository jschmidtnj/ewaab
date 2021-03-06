import { Ctx, FieldResolver, Resolver, ResolverInterface, Root } from 'type-graphql';
import { Any, getRepository } from 'typeorm';
import MessageGroup, { MessageGroupUser } from '../schema/users/messageGroup.entity';
import User, { PublicUser } from '../schema/users/user.entity';
import { GraphQLContext } from '../utils/context';
import { defaultDBCache } from '../utils/variables';
import { keys } from 'ts-transformer-keys';

@Resolver(_of => MessageGroup)
class MessageGroupsResolver implements ResolverInterface<MessageGroup> {
  @FieldResolver()
  async users(@Root() messageGroup: MessageGroup): Promise<PublicUser[]> {
    const UserModel = getRepository(User);
    const data = (await UserModel.find({
      where: {
        id: Any(messageGroup.userIDs)
      },
      select: keys<PublicUser>(),
      cache: defaultDBCache
    })).map(user => user as PublicUser);

    return data;
  }

  @FieldResolver()
  async groupData(@Root() messageGroup: MessageGroup, @Ctx() ctx: GraphQLContext): Promise<MessageGroupUser> {
    const MessageGroupUserModel = getRepository(MessageGroupUser);
    const data = await MessageGroupUserModel.findOne({
      userID: ctx.auth!.id,
      groupID: messageGroup.id
    }, {
      cache: defaultDBCache
    });
    if (!data) {
      throw new Error(`cannot find message group data for user ${ctx.auth!.id}`);
    }
    return data;
  }
}

export default MessageGroupsResolver;
