import { verifyLoggedIn } from '../auth/checkAuth';
import { GraphQLContext } from '../utils/context';
import { Resolver, ArgsType, Field, Args, Ctx, Mutation } from 'type-graphql';
import { getRepository } from 'typeorm';
import Reaction, { ReactionParentType } from '../schema/reactions/reaction.entity';
import { Matches } from 'class-validator';
import { uuidRegex } from '../shared/variables';
import esb from 'elastic-builder';
import { elasticClient } from '../elastic/init';
import { postIndexName, messageIndexName, commentIndexName } from '../elastic/settings';
import Post from '../schema/posts/post.entity';
import Message from '../schema/users/message.entity';
import Comment from '../schema/posts/comment.entity';
import ReactionCount from '../schema/reactions/reactionCount.entity';

export const deleteReactions = async (parent: string, parentType: ReactionParentType): Promise<void> => {
  const ReactionModel = getRepository(Reaction);
  for (const reaction of await ReactionModel.find({
    where: {
      parent,
      parentType
    },
    select: ['id']
  })) {
    await ReactionModel.delete(reaction.id);
  }
  const ReactionCountModel = getRepository(ReactionCount);
  for (const reactionCount of await ReactionCountModel.find({
    where: {
      parent,
      parentType
    },
    select: ['id']
  })) {
    await ReactionCountModel.delete(reactionCount.id);
  }
};

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
      select: ['id', 'user', 'parent', 'parentType', 'type']
    });
    if (!reactionData) {
      throw new Error('no reaction found');
    }
    if (reactionData.user !== ctx.auth.id) {
      throw new Error(`user not authorized to delete reaction with id ${reactionData.id}`);
    }
    await ReactionModel.delete(reactionData.id);

    const ReactionCountModel = getRepository(ReactionCount);
    const currentCount = await ReactionCountModel.findOne({
      where: {
        parent: reactionData.parent,
        parentType: reactionData.parentType,
        type: reactionData.type,
      },
      select: ['id', 'count']
    });
    if (!currentCount) {
      throw new Error(`cannot find reaction count for reaction ${id}`);
    }
    if (currentCount.count === 1) {
      await ReactionCountModel.delete(currentCount.id);
    } else {
      await ReactionCountModel.decrement({
        id: currentCount.id
      }, 'count', 1);
    }

    const updateReactionsScript = esb.script('source', 'ctx._source.reactionCount--').lang('painless');

    if ([ReactionParentType.post, ReactionParentType.message, ReactionParentType.comment].includes(reactionData.parentType)) {
      if (reactionData.parentType === ReactionParentType.post) {
        const PostModel = getRepository(Post);
        await PostModel.decrement({
          id: reactionData.parent
        }, 'reactionCount', 1);
        await elasticClient.update({
          index: postIndexName,
          id: reactionData.parent,
          body: {
            script: updateReactionsScript.toJSON()
          }
        });
      } else if (reactionData.parentType === ReactionParentType.message) {
        const MessageModel = getRepository(Message);
        await MessageModel.decrement({
          id: reactionData.parent
        }, 'reactionCount', 1);
        await elasticClient.update({
          index: messageIndexName,
          id: reactionData.parent,
          body: {
            script: updateReactionsScript.toJSON()
          }
        });
      } else if (reactionData.parentType === ReactionParentType.comment) {
        const CommentModel = getRepository(Comment);
        await CommentModel.decrement({
          id: reactionData.parent
        }, 'reactionCount', 1);
        await elasticClient.update({
          index: commentIndexName,
          id: reactionData.parent,
          body: {
            script: updateReactionsScript.toJSON()
          }
        });
      } else {
        throw new Error(`unhandled parent type ${reactionData.parentType}`);
      }
    }

    return `deleted reaction ${reactionData.id}`;
  }
}

export default DeleteReactionResolver;
