import { Args, ArgsType, Ctx, Query, Resolver } from 'type-graphql';
import { getRepository } from 'typeorm';
import { verifyLoggedIn } from '../auth/checkAuth';
import MessageGroup from '../schema/users/messageGroup.entity';
import { PaginationArgs } from '../schema/utils/pagination';
import { GraphQLContext } from '../utils/context';
import { defaultDBCache } from '../utils/variables';
import { connectionName } from '../db/connect';

@ArgsType()
export class MessageGroupsArgs extends PaginationArgs {
  // body
}

export const getMessageGroups = async (args: MessageGroupsArgs, userID: string): Promise<MessageGroup[]> => {
  const MessageGroupModel = getRepository(MessageGroup, connectionName);
  const data = await MessageGroupModel.createQueryBuilder('messageGroup')
    .where('messageGroup.userIDs @> :userIDs').setParameters({
      userIDs: [userID]
    }).take(args.perpage).skip(args.page * args.perpage).cache(defaultDBCache).getMany();
  return data;
};

@Resolver()
class MessageGroupsResolver {
  @Query(_returns => [MessageGroup])
  async messageGroups(@Args() args: MessageGroupsArgs, @Ctx() ctx: GraphQLContext): Promise<MessageGroup[]> {
    if (!verifyLoggedIn(ctx)) {
      throw new Error('user not logged in to view message groups');
    }
    return await getMessageGroups(args, ctx.auth!.id);
  }
}

export default MessageGroupsResolver;
