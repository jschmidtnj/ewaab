import { Resolver, Query, ArgsType, Field, Int, Args, Ctx, FieldResolver } from 'type-graphql';
import { Min, Max, Matches } from 'class-validator';
import { uuidRegex } from '../shared/variables';
import { AuthAccessType, checkPostAccess } from '../auth/checkAuth';
import { GraphQLContext } from '../utils/context';
import ReactionCount, { ReactionsData } from '../schema/posts/reactionCount.entity';
import { getRepository } from 'typeorm';
import { ReactionParentType } from '../schema/posts/reaction.entity';

// TODO - fix this file

const maxPerPage = 20;

@ArgsType()
export class PostReactionsArgs {
  @Min(0, {
    message: 'page number must be greater than or equal to 0'
  })
  @Field(_type => Int, {
    description: 'page number',
    nullable: true,
    defaultValue: 0
  })
  page: number;

  @Min(1, {
    message: 'per page must be greater than or equal to 1'
  })
  @Max(maxPerPage, {
    message: `per page must be less than or equal to ${maxPerPage}`
  })
  @Field(_type => Int, {
    description: 'number per page',
    nullable: true,
    defaultValue: 10
  })
  perpage: number;
}

@ArgsType()
class ReactionsArgs extends PostReactionsArgs {
  @Field(_type => String, { description: 'parent id' })
  @Matches(uuidRegex, {
    message: 'invalid parent id provided, must be uuid v4'
  })
  parent: string;

  @Field(_type => ReactionParentType, { description: 'parent type' })
  parentType: ReactionParentType;
}

export const getReactions = async (args: PostReactionsArgs, parent: string,
  parentType: ReactionParentType): Promise<ReactionsData> => {
  // TODO - figure out how to get the reactions results for a post
  const ReactionCountModel = getRepository(ReactionCount);
  await ReactionCountModel.find({
    select: ['type', 'count'],
    where: {
      parent,
      parentType
    }
  });
  return {
    counts: [],
    reactions: []
  };
};

@Resolver()
class ReactionsResolver {
  @FieldResolver(_returns => ReactionCount[])
  async counts(@Args() args: ReactionsArgs, @Ctx() ctx: GraphQLContext): Promise<ReactionCount[]> {
    if (!await checkPostAccess({
      ctx,
      accessType: AuthAccessType.view,
      id: args.post
    })) {
      throw new Error(`user of type ${ctx.auth!.type} not authorized to view post ${args.post}`);
    }

    return await getReactions(args, args.post);
  }
}

export default ReactionsResolver;
