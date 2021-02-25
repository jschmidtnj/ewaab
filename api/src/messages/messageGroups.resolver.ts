import { Args, ArgsType, Ctx, Query, Resolver } from 'type-graphql';
import { Any, getRepository } from 'typeorm';
import { verifyLoggedIn } from '../auth/checkAuth';
import MessageGroup from '../schema/users/messageGroup.entity';
import { PaginationArgs } from '../schema/utils/pagination';
import { GraphQLContext } from '../utils/context';

@ArgsType()
export class MessageGroupsArgs extends PaginationArgs {
  // body
}

export const getMessageGroups = async (args: MessageGroupsArgs, userID: string): Promise<MessageGroup[]> => {
  const MessageGroupModel = getRepository(MessageGroup);
  const data = await MessageGroupModel.find({
    where: {
      userIDs: Any([userID])
    },
    take: args.perpage,
    skip: args.page * args.perpage
  });
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
