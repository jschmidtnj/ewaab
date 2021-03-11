import { Resolver, ArgsType, Field, Args, Mutation, Ctx } from 'type-graphql';
import { MinLength, Matches } from 'class-validator';
import { getRepository } from 'typeorm';
import { strMinLen, uuidRegex } from '../shared/variables';
import { AuthAccessType, checkMessageAccess, checkPostAccess } from '../auth/checkAuth';
import { GraphQLContext } from '../utils/context';
import Reaction, { ReactionParentType } from '../schema/reactions/reaction.entity';
import { v4 as uuidv4 } from 'uuid';
import Post from '../schema/posts/post.entity';
import { elasticClient } from '../elastic/init';
import esb from 'elastic-builder';
import { commentIndexName, messageIndexName, postIndexName } from '../elastic/settings';
import Message from '../schema/users/message.entity';
import Comment from '../schema/posts/comment.entity';
import ReactionCount from '../schema/reactions/reactionCount.entity';
import { connectionName } from '../db/connect';

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
    } else if ([ReactionParentType.comment, ReactionParentType.post].includes(args.parentType)) {
      let postID = args.parent;
      if (args.parentType === ReactionParentType.comment) {
        const CommentModel = getRepository(Comment, connectionName);
        const commentData = await CommentModel.findOne(args.parent, {
          select: ['post']
        });
        if (!commentData) {
          throw new Error(`cannot find comment with id ${args.parent}`);
        }
        postID = commentData.post;
      }
      if (!await checkPostAccess({
        ctx,
        accessType: AuthAccessType.view,
        id: postID
      })) {
        throw new Error(`user does not have access to view post ${args.parent}`);
      }
    } else {
      throw new Error(`unhandled parent type ${args.parentType}`);
    }

    const ReactionModel = getRepository(Reaction, connectionName);
    const newReaction = await ReactionModel.save({
      id: uuidv4(),
      created: new Date().getTime(),
      parent: args.parent,
      parentType: args.parentType,
      type: args.reaction,
      user: ctx.auth!.id
    });

    const ReactionCountModel = getRepository(ReactionCount, connectionName);
    const currentCount = await ReactionCountModel.findOne({
      where: {
        parent: args.parent,
        parentType: args.parentType,
        type: args.reaction,
      },
      select: ['id']
    });
    if (!currentCount) {
      await ReactionCountModel.save({
        id: uuidv4(),
        parent: args.parent,
        parentType: args.parentType,
        type: args.reaction,
        count: 1
      });
    } else {
      await ReactionCountModel.increment({
        id: currentCount.id
      }, 'count', 1);
    }

    const updateReactionsScript = esb.script('source', 'ctx._source.reactionCount++').lang('painless');

    if ([ReactionParentType.post, ReactionParentType.message, ReactionParentType.comment].includes(args.parentType)) {
      if (args.parentType === ReactionParentType.post) {
        const PostModel = getRepository(Post, connectionName);
        await PostModel.increment({
          id: args.parent
        }, 'reactionCount', 1);
        await elasticClient.update({
          index: postIndexName,
          id: args.parent,
          body: {
            script: updateReactionsScript.toJSON()
          }
        });
      } else if (args.parentType === ReactionParentType.message) {
        const MessageModel = getRepository(Message, connectionName);
        await MessageModel.increment({
          id: args.parent
        }, 'reactionCount', 1);
        await elasticClient.update({
          index: messageIndexName,
          id: args.parent,
          body: {
            script: updateReactionsScript.toJSON()
          }
        });
      } else if (args.parentType === ReactionParentType.comment) {
        const CommentModel = getRepository(Comment, connectionName);
        await CommentModel.increment({
          id: args.parent
        }, 'reactionCount', 1);
        await elasticClient.update({
          index: commentIndexName,
          id: args.parent,
          body: {
            script: updateReactionsScript.toJSON()
          }
        });
      } else {
        throw new Error(`unhandled parent type ${args.parentType}`);
      }
    }

    return newReaction.id;
  }
}

export default AddReactionResolver;
