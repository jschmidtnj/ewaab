import { Resolver, ArgsType, Field, Args, Mutation, Ctx } from 'type-graphql';
import { MinLength, Matches } from 'class-validator';
import { getRepository } from 'typeorm';
import { strMinLen, uuidRegex } from '../shared/variables';
import { AuthAccessType, checkMessageAccess, checkPostAccess } from '../auth/checkAuth';
import { GraphQLContext } from '../utils/context';
import { getTime } from '../shared/time';
import Reaction, { ReactionParentType } from '../schema/reactions/reaction.entity';
import { nanoid } from 'nanoid';

@ArgsType()
class AddReactionArgs {
  @Field(_type => String, { description: 'parent id' })
  @Matches(uuidRegex, {
    message: 'invalid parent id provided, must be uuid v4'
  })
  parent: string;

  @Field(_type => ReactionParentType, { description: 'parent type' })
  parentType: ReactionParentType;

  @Field(_type => String, { description: 'reaction' })
  @MinLength(strMinLen, {
    message: `reaction type has a min length of ${strMinLen} characters`
  })
  reaction: string;
}

@Resolver()
class AddReactionResolver {
  @Mutation(_returns => String)
  async addReaction(@Args() args: AddReactionArgs, @Ctx() ctx: GraphQLContext): Promise<string> {
    if (args.parentType === ReactionParentType.message) {
      if (!await checkMessageAccess({
        ctx,
        publisher: args.parent,
        accessType: AuthAccessType.view
      })) {
        throw new Error(`user does not have access to view message ${args.parent}`);
      }
    } else if ([ReactionParentType.comment, ReactionParentType.message].includes(args.parentType)) {
      if (!await checkPostAccess({
        ctx,
        accessType: AuthAccessType.view,
        id: args.parent
      })) {
        throw new Error(`user does not have access to view post ${args.parent}`);
      }
    } else {
      throw new Error(`unhandled parent type ${args.parentType}`);
    }

    const ReactionModel = getRepository(Reaction);
    const newReaction = await ReactionModel.save({
      id: nanoid(),
      created: getTime(),
      parent: args.parent,
      parentType: args.parentType,
      reaction: args.reaction,
      user: ctx.auth!.id
    });

    return `created reaction ${newReaction.id}`;
  }
}

export default AddReactionResolver;
