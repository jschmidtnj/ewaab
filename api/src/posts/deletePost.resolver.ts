import { verifyLoggedIn } from '../auth/checkAuth';
import { GraphQLContext } from '../utils/context';
import { Resolver, ArgsType, Field, Args, Ctx, Mutation } from 'type-graphql';
import { getRepository } from 'typeorm';
import Post from '../schema/posts/post.entity';
import { elasticClient } from '../elastic/init';
import { commentIndexName, postIndexName } from '../elastic/settings';
import { UserType } from '../schema/users/user.entity';
import { deleteMedia } from '../users/media.resolver';
import { Matches } from 'class-validator';
import { uuidRegex } from '../shared/variables';
import Comment from '../schema/posts/comment.entity';
import { bulkWriteToElastic } from '../elastic/elastic';
import { WriteType } from '../elastic/writeType';

@ArgsType()
class DeleteArgs {
  @Field(_type => String, { description: 'post id' })
  @Matches(uuidRegex, {
    message: 'invalid post id provided, must be uuid v4'
  })
  id: string;
}

@Resolver()
class DeletePostResolver {
  @Mutation(_returns => String)
  async deletePost(@Args() { id }: DeleteArgs, @Ctx() ctx: GraphQLContext): Promise<string> {
    if (!verifyLoggedIn(ctx) || !ctx.auth) {
      throw new Error('cannot find auth data');
    }
    const PostModel = getRepository(Post);
    const postData = await PostModel.findOne(id, {
      select: ['id', 'publisher', 'media']
    });
    if (!postData) {
      throw new Error('no post found');
    }

    if (ctx.auth.type !== UserType.admin) {
      if (postData.publisher !== ctx.auth.id) {
        throw new Error(`user ${ctx.auth.id} is not publisher of post ${id}`);
      }
    }

    const CommentModel = getRepository(Comment);
    const comments = await CommentModel.find({
      select: ['id'],
      where: {
        post: id
      }
    });
    if (comments.length > 0) {
      await bulkWriteToElastic(comments.map(commentData => ({
        action: WriteType.delete,
        id: commentData.id,
        index: commentIndexName
      })));

      for (const commentData of comments) {
        await CommentModel.delete(commentData.id);
      }
    }

    await elasticClient.delete({
      id,
      index: postIndexName
    });
    await PostModel.delete(id);

    if (postData.media) {
      await deleteMedia(postData.media);
    }

    return `deleted post ${id}`;
  }
}

export default DeletePostResolver;
