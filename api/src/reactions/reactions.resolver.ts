import { ArgsType } from 'type-graphql';
import ReactionCount from '../schema/reactions/reactionCount.entity';
import { getRepository } from 'typeorm';
import Reaction, { ReactionParentType } from '../schema/reactions/reaction.entity';
import { PaginationArgs } from '../schema/utils/pagination';
import { defaultDBCache } from '../utils/variables';
import { connectionName } from '../db/connect';

@ArgsType()
export class UserReactionsArgs extends PaginationArgs {
  // body
}

export const getUserReactions = async (args: UserReactionsArgs, parent: string,
  parentType: ReactionParentType, user: string): Promise<Reaction[]> => {
  const ReactionModel = getRepository(Reaction, connectionName);
  const data = await ReactionModel.find({
    where: {
      parent,
      parentType,
      user
    },
    order: {
      created: 'DESC'
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
  const ReactionCountModel = getRepository(ReactionCount, connectionName);
  const data = await ReactionCountModel.find({
    where: {
      parent,
      parentType
    },
    order: {
      count: 'DESC'
    },
    take: args.perpage,
    skip: args.page * args.perpage,
    cache: defaultDBCache
  });
  return data;
};
