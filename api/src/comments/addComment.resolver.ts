import { Resolver, ArgsType, Field, Args, Mutation, Ctx } from 'type-graphql';
import { MinLength, Matches } from 'class-validator';
import { getRepository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { elasticClient } from '../elastic/init';
import { commentIndexName, postIndexName } from '../elastic/settings';
import { strMinLen, uuidRegex } from '../shared/variables';
import { AuthAccessType, checkPostAccess } from '../auth/checkAuth';
import { GraphQLContext } from '../utils/context';
import Comment, { SearchComment } from '../schema/posts/comment.entity';
import Post from '../schema/posts/post.entity';
import esb from 'elastic-builder';

@ArgsType()
class AddCommentArgs {
  @Field(_type => String, { description: 'post id' })
  @Matches(uuidRegex, {
    message: 'invalid post id provided, must be uuid v4'
  })
  post: string;

  @Field(_type => String, { description: 'comment content' })
  @MinLength(strMinLen, {
    message: `comment content must contain at least ${strMinLen} characters`
  })
  content: string;
}

@Resolver()
class AddCommentResolver {
  @Mutation(_returns => String)
  async addComment(@Args() args: AddCommentArgs, @Ctx() ctx: GraphQLContext): Promise<string> {
    if (!await checkPostAccess({
      ctx,
      accessType: AuthAccessType.view,
      id: args.post
    })) {
      throw new Error(`user of type ${ctx.auth!.type} not authorized to view post ${args.post}`);
    }

    const CommentModel = getRepository(Comment);
    const now = new Date().getTime();
    const searchComment: SearchComment = {
      content: args.content,
      created: now,
      updated: now,
      publisher: ctx.auth!.id,
      post: args.post,
      reactionCount: 0
    };

    const id = uuidv4();

    await elasticClient.index({
      id,
      index: commentIndexName,
      body: searchComment
    });
    const newComment = await CommentModel.save({
      ...searchComment,
      id
    });

    const updateCommentsScript = esb.script('source', 'ctx._source.commentCount++').lang('painless');

    const PostModel = getRepository(Post);
    await PostModel.increment({
      id: args.post
    }, 'commentCount', 1);
    await elasticClient.update({
      index: postIndexName,
      id: args.post,
      body: {
        script: updateCommentsScript.toJSON()
      }
    });

    return `created comment ${newComment.id}`;
  }
}

export default AddCommentResolver;
