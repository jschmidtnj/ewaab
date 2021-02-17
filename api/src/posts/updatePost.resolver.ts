import { GraphQLContext } from '../utils/context';
import { Resolver, ArgsType, Field, Args, Ctx, Mutation } from 'type-graphql';
import { MinLength, IsOptional, IsUrl } from 'class-validator';
import { strMinLen } from '../shared/variables';
import { verifyLoggedIn } from '../auth/checkAuth';
import { getRepository } from 'typeorm';
import { QueryPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import statusCodes from 'http-status-codes';
import { ApolloError } from 'apollo-server-express';
import { elasticClient } from '../elastic/init';
import { postIndexName } from '../elastic/settings';
import Post from '../schema/posts/post.entity';
import { UserType } from '../schema/users/user.entity';

@ArgsType()
class UpdatePostArgs {
  @Field(_type => String, { description: 'post id' })
  id: string;

  @Field(_type => String, { description: 'title', nullable: true })
  @IsOptional()
  @MinLength(strMinLen, {
    message: `post title must contain at least ${strMinLen} characters`
  })
  title?: string;

  @Field(_type => String, { description: 'content', nullable: true })
  @IsOptional()
  @MinLength(strMinLen, {
    message: `post content must contain at least ${strMinLen} characters`
  })
  content?: string;

  @Field(_type => String, { description: 'link', nullable: true })
  @IsOptional()
  @IsUrl({}, {
    message: 'invalid link provided'
  })
  link?: string;
}

@Resolver()
class UpdatePostResolver {
  @Mutation(_returns => String)
  async updatePost(@Args() args: UpdatePostArgs, @Ctx() ctx: GraphQLContext): Promise<string> {
    if (!verifyLoggedIn(ctx) || !ctx.auth) {
      throw new Error('user not logged in');
    }
    if (!Object.values(args).some(elem => elem !== undefined)) {
      throw new ApolloError('no updates found', `${statusCodes.BAD_REQUEST}`);
    }
    const postUpdateData: QueryPartialEntity<Post> = {};
    const PostModel = getRepository(Post);

    if (ctx.auth.type !== UserType.admin) {
      const postData = await PostModel.findOne(args.id, {
        select: ['id', 'publisher']
      });
      if (!postData) {
        throw new Error('no post found');
      }
      if (postData.publisher !== ctx.auth.id) {
        throw new Error(`user ${ctx.auth.id} is not publisher of post ${args.id}`);
      }
    }

    // other fields
    if (args.title !== undefined) {
      postUpdateData.title = args.title;
    }
    if (args.content !== undefined) {
      postUpdateData.content = args.content;
    }
    if (args.link !== undefined) {
      postUpdateData.link = args.link;
    }
    const now = new Date().getTime();
    postUpdateData.updated = now;

    await PostModel.update(args.id, postUpdateData);
    await elasticClient.update({
      id: args.id,
      index: postIndexName,
      body: {
        doc: postUpdateData
      }
    });
    return `updated post ${args.id}`;
  }
}

export default UpdatePostResolver;
