import { verifyLoggedIn } from '../auth/checkAuth';
import { GraphQLContext } from '../utils/context';
import { Resolver, ArgsType, Field, Args, Ctx, Mutation } from 'type-graphql';
import { getRepository } from 'typeorm';
import Reaction from '../schema/posts/reaction.entity';
import { Matches } from 'class-validator';
import { uuidRegex } from '../shared/variables';

@ArgsType()
class DeleteArgs {
  @Field(_type => String, { description: 'reaction id' })
  @Matches(uuidRegex, {
    message: 'invalid reaction id provided, must be uuid v4'
  })
  id: string;
}

@Resolver()
class DeleteReactionResolver {
  @Mutation(_returns => String)
  async deleteReaction(@Args() { id }: DeleteArgs, @Ctx() ctx: GraphQLContext): Promise<string> {
    if (!verifyLoggedIn(ctx) || !ctx.auth) {
      throw new Error('cannot find auth data');
    }
    const ReactionModel = getRepository(Reaction);
    const reactionData = await ReactionModel.findOne(id, {
      select: ['id', 'user']
    });
    if (!reactionData) {
      throw new Error('no reaction found');
    }
    if (reactionData.user !== ctx.auth.id) {
      throw new Error(`user not authorized to delete reaction with id ${reactionData.id}`);
    }
    await ReactionModel.delete(reactionData.id);

    return `deleted post ${reactionData.id}`;
  }
}

export default DeleteReactionResolver;
