import { Resolver, ArgsType, Field, Args, Mutation, Ctx } from 'type-graphql';
import { MinLength, IsUrl } from 'class-validator';
import { getRepository } from 'typeorm';
import { elasticClient } from '../elastic/init';
import { postIndexName } from '../elastic/settings';
import Post, { SearchPost } from '../schema/posts/post.entity';
import { strMinLen, PostType, UserType } from '../shared/variables';
import { verifyLoggedIn } from '../auth/checkAuth';
import { GraphQLContext } from '../utils/context';

@ArgsType()
class AddPostArgs {
  @Field(_type => String, { description: 'post title' })
  @MinLength(strMinLen, {
    message: `post title must contain at least ${strMinLen} characters`
  })
  title: string;

  @Field(_type => String, { description: 'post content' })
  @MinLength(strMinLen, {
    message: `post content must contain at least ${strMinLen} characters`
  })
  content: string;

  @Field(_type => PostType, { description: 'post type' })
  type: PostType;

  @Field(_type => String, { description: 'username' })
  @IsUrl({}, {
    message: 'invalid link provided'
  })
  link: string;
}

const userAccessMap: Record<UserType, PostType[]> = {
  [UserType.admin]: Object.values(PostType),
  [UserType.user]: [PostType.studentCommunity],
  [UserType.thirdParty]: [PostType.mentorNews],
  [UserType.visitor]: [],
};

@Resolver()
class AddPostResolver {
  @Mutation(_returns => String)
  async addPost(@Args() args: AddPostArgs, @Ctx() ctx: GraphQLContext): Promise<string> {
    if (!verifyLoggedIn(ctx) || !ctx.auth) {
      throw new Error('user not logged in');
    }
    if (!userAccessMap[ctx.auth.type].includes(args.type)) {
      throw new Error(`user of type ${ctx.auth.type} not authorized to post ${args.type}`)
    }

    const PostModel = getRepository(Post);
    const now = new Date().getTime();
    const searchPost: SearchPost = {
      title: args.title,
      content: args.content,
      type: args.type,
      created: now,
      updated: now,
      publisher: ctx.auth.id
    };

    const newPost = await PostModel.save({
      ...searchPost,
    });
    await elasticClient.index({
      id: newPost.id,
      index: postIndexName,
      body: searchPost
    });
    searchPost.id = newPost.id;

    return `created post ${newPost.id}`;
  }
}

export default AddPostResolver;
