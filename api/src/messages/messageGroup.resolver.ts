import { FieldResolver, Resolver, ResolverInterface, Root } from 'type-graphql';
import { Any, getRepository } from 'typeorm';
import MessageGroup from '../schema/users/messageGroup.entity';
import User, { PublicUser } from '../schema/users/user.entity';
import { publicUserSelect } from '../users/publicUser.resolver';

@Resolver(_of => MessageGroup)
class MessageGroupsResolver implements ResolverInterface<MessageGroup> {
  @FieldResolver()
  async users(@Root() messageGroup: MessageGroup): Promise<PublicUser[]> {
    const UserModel = getRepository(User);
    const data = (await UserModel.find({
      where: {
        id: Any(messageGroup.userIDs)
      },
      select: publicUserSelect
    })).map(user => user as PublicUser);

    return data;
  }
}

export default MessageGroupsResolver;
