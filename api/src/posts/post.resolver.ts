import { verifyLoggedIn } from '../auth/checkAuth';
import { Resolver, Ctx, Query, ArgsType, Field, Args } from 'type-graphql';
import { GraphQLContext } from '../utils/context';
import { getRepository } from 'typeorm';
import Post, { PostType } from '../schema/posts/post.entity';
import { UserType } from '../schema/users/user.entity';

export const postViewMap: Record<UserType, PostType[]> = {
  [UserType.admin]: Object.values(PostType),
  [UserType.user]: Object.values(PostType),
  [UserType.thirdParty]: [PostType.mentorNews],
  [UserType.visitor]: [],
};

@ArgsType()
export class PostArgs {
  @Field(_type => String, { description: 'search query' })
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
      throw new Error(`cannot find user with id ${ctx.auth.id}`);
    }
    if (!postViewMap[ctx.auth.type].includes(post.type)) {
      throw new Error(`user of type ${ctx.auth.type} not authorized to find posts of type ${post.type}`);
    }
    return post;
  }
}

export default PostResolver;
