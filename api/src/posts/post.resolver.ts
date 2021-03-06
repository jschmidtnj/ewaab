import { AuthAccessType, checkPostAccess, verifyLoggedIn } from '../auth/checkAuth';
import { Resolver, Ctx, Query, ArgsType, Field, Args } from 'type-graphql';
import { GraphQLContext } from '../utils/context';
import { getRepository } from 'typeorm';
import Post from '../schema/posts/post.entity';

@ArgsType()
export class PostArgs {
  @Field(_type => String, { description: 'post id' })
  id: string;
}

@Resolver(_of => Post)
class PostResolver {
  @Query(_type => Post, { description: 'post data' })
  async post(@Args() args: PostArgs, @Ctx() ctx: GraphQLContext): Promise<Post> {
    if (!verifyLoggedIn(ctx) || !ctx.auth) {
      throw new Error('user not logged in');
    }
    const PostModel = getRepository(Post);
    const post = await PostModel.findOne(args.id);
    if (!post) {
      throw new Error(`cannot find post with id ${args.id}`);
    }
    if (!await checkPostAccess({
      ctx,
      accessType: AuthAccessType.view,
      ...post
    })) {
      throw new Error(`user of type ${ctx.auth!.type} not authorized to view post ${args.id}`);
    }
    return post;
  }
}

export default PostResolver;
