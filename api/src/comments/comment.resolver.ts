import { AuthAccessType, checkPostAccess, verifyLoggedIn } from '../auth/checkAuth';
import { Resolver, Ctx, Query, ArgsType, Field, Args } from 'type-graphql';
import { GraphQLContext } from '../utils/context';
import { getRepository } from 'typeorm';
import Comment from '../schema/posts/comment.entity';

@ArgsType()
class CommentArgs {
  @Field(_type => String, { description: 'comment id' })
  id: string;
}

@Resolver(_of => Comment)
class CommentResolver {
  @Query(_type => Comment, { description: 'comment data' })
  async comment(@Args() args: CommentArgs, @Ctx() ctx: GraphQLContext): Promise<Comment> {
    if (!verifyLoggedIn(ctx) || !ctx.auth) {
      throw new Error('user not logged in');
    }
    const CommentModel = getRepository(Comment);
    const comment = await CommentModel.findOne(args.id);
    if (!comment) {
      throw new Error(`cannot find comment with id ${args.id}`);
    }
    if (!await checkPostAccess({
      ctx,
      accessType: AuthAccessType.view,
      id: comment.post
    })) {
      throw new Error(`user of type ${ctx.auth!.type} not authorized to view comment for post ${comment.post}`);
    }
    return comment;
  }
}

export default CommentResolver;
