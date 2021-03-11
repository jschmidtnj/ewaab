import { verifyLoggedIn } from '../auth/checkAuth';
import { GraphQLContext } from '../utils/context';
import { Resolver, ArgsType, Field, Args, Ctx, Mutation } from 'type-graphql';
import { getRepository } from 'typeorm';
import Comment from '../schema/posts/comment.entity';
import { elasticClient } from '../elastic/init';
import { commentIndexName, postIndexName } from '../elastic/settings';
import { UserType } from '../schema/users/user.entity';
import { Matches } from 'class-validator';
import { uuidRegex } from '../shared/variables';
import Post from '../schema/posts/post.entity';
import esb from 'elastic-builder';
import { deleteReactions } from '../reactions/deleteReaction.resolver';
import { ReactionParentType } from '../schema/reactions/reaction.entity';
import { connectionName } from '../db/connect';

@ArgsType()
class DeleteArgs {
  @Field(_type => String, { description: 'comment id' })
  @Matches(uuidRegex, {
    message: 'invalid comment id provided, must be uuid v4'
  })
  id: string;
}

@Resolver()
class DeleteCommentResolver {
  @Mutation(_returns => String)
  async deleteComment(@Args() { id }: DeleteArgs, @Ctx() ctx: GraphQLContext): Promise<string> {
    if (!verifyLoggedIn(ctx) || !ctx.auth) {
      throw new Error('cannot find auth data');
    }
    const CommentModel = getRepository(Comment, connectionName);
    const commentData = await CommentModel.findOne(id, {
      select: ['id', 'publisher', 'post']
    });
    if (!commentData) {
      throw new Error('no comment found');
    }

    if (ctx.auth.type !== UserType.admin) {
      if (commentData.publisher !== ctx.auth.id) {
        throw new Error(`user ${ctx.auth.id} is not publisher of post ${id}`);
      }
    }
    await elasticClient.delete({
      id,
      index: commentIndexName
    });
    await CommentModel.delete(id);

    await deleteReactions(id, ReactionParentType.comment);

    const updateCommentsScript = esb.script('source', 'ctx._source.commentCount--').lang('painless');

    const PostModel = getRepository(Post, connectionName);
    await PostModel.decrement({
      id: commentData.post
    }, 'commentCount', 1);
    await elasticClient.update({
      index: postIndexName,
      id: commentData.post,
      body: {
        script: updateCommentsScript.toJSON()
      }
    });

    return `deleted post ${id}`;
  }
}

export default DeleteCommentResolver;
