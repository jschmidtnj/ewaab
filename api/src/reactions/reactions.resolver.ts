import { ArgsType } from 'type-graphql';
import ReactionCount from '../schema/reactions/reactionCount.entity';
import { getRepository } from 'typeorm';
import Reaction, { ReactionParentType } from '../schema/reactions/reaction.entity';
import { PaginationArgs } from '../schema/utils/pagination';
import { defaultDBCache } from '../utils/variables';

@ArgsType()
export class UserReactionsArgs extends PaginationArgs {
  // body
}

export const getUserReactions = async (args: UserReactionsArgs, parent: string,
  parentType: ReactionParentType): Promise<Reaction[]> => {
  const ReactionModel = getRepository(Reaction);
  const data = await ReactionModel.find({
    where: {
      parent,
      parentType
    },
    take: args.perpage,
    skip: args.page * args.perpage,
    cache: defaultDBCache
  });
  return data;
};

@ArgsType()
export class CountReactionsArgs extends PaginationArgs {
  // body
}

export const getReactionCounts = async (args: CountReactionsArgs, parent: string,
  parentType: ReactionParentType): Promise<ReactionCount[]> => {
  const ReactionCountModel = getRepository(ReactionCount);
  const data = await ReactionCountModel.find({
    where: {
      parent,
      parentType
    },
    take: args.perpage,
    skip: args.page * args.perpage,
    cache: defaultDBCache
  });
  return data;
};
