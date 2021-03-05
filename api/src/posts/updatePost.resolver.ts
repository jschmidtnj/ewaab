import { GraphQLContext } from '../utils/context';
import { Resolver, ArgsType, Field, Args, Ctx, Mutation } from 'type-graphql';
import { MinLength, IsOptional, IsUrl, ValidateIf, Matches } from 'class-validator';
import { strMinLen, uuidRegex } from '../shared/variables';
import { verifyLoggedIn } from '../auth/checkAuth';
import { getRepository } from 'typeorm';
import { QueryPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import statusCodes from 'http-status-codes';
import { GraphQLUpload, FileUpload } from 'graphql-upload';
import { elasticClient } from '../elastic/init';
import { postIndexName } from '../elastic/settings';
import Post from '../schema/posts/post.entity';
import { UserType } from '../schema/users/user.entity';
import { ApolloError } from 'apollo-server-express';
import { deleteMedia } from '../users/media.resolver';
import { handlePostMedia } from './addPost.resolver';
import { removeKeys } from '../utils/misc';

@ArgsType()
class UpdatePostArgs {
  @Field(_type => String, { description: 'post id' })
  @Matches(uuidRegex, {
    message: 'invalid post id provided, must be uuid v4'
  })
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
  @ValidateIf((_obj, val?: string) => val !== undefined && val.length > 0)
  @IsUrl({}, {
    message: 'invalid link provided'
  })
  link?: string;

  @Field(_type => GraphQLUpload, { description: 'media', nullable: true })
  @IsOptional()
  media?: Promise<FileUpload>;

  @Field(_type => Boolean, { description: 'delete media', nullable: true, defaultValue: false })
  deleteMedia: boolean;
}

@Resolver()
class UpdatePostResolver {
  @Mutation(_returns => String)
  async updatePost(@Args() args: UpdatePostArgs, @Ctx() ctx: GraphQLContext): Promise<string> {
    if (!verifyLoggedIn(ctx) || !ctx.auth) {
      throw new Error('user not logged in');
    }
    if (!removeKeys(args, ['deleteMedia', 'id']).some(elem => elem !== undefined)) {
      throw new ApolloError('no updates found', `${statusCodes.BAD_REQUEST}`);
    }

    const PostModel = getRepository(Post);
    const postData = await PostModel.findOne(args.id, {
      select: ['id', 'publisher', 'media']
    });
    if (!postData) {
      throw new Error('no post found');
    }

    if (ctx.auth.type !== UserType.admin) {
      if (postData.publisher !== ctx.auth.id) {
        throw new Error(`user ${ctx.auth.id} is not publisher of post ${args.id}`);
      }
    }

    const postUpdateData: QueryPartialEntity<Post> = {};
    if (args.title !== undefined) {
      postUpdateData.title = args.title;
    }
    if (args.content !== undefined) {
      postUpdateData.content = args.content;
    }
    if (args.link !== undefined) {
      postUpdateData.link = args.link;
    }
    if (args.deleteMedia) {
      postUpdateData.media = null;
    }
    const now = new Date().getTime();
    postUpdateData.updated = now;

    const mediaID = await handlePostMedia(args.id, args.media);
    if (mediaID) {
      postUpdateData.media = mediaID;
    }

    await PostModel.update(args.id, postUpdateData);
    if (args.deleteMedia) {
      postUpdateData.media = '';
    }
    await elasticClient.update({
      id: args.id,
      index: postIndexName,
      body: {
        doc: postUpdateData
      }
    });

    if (postData.media) {
      await deleteMedia(postData.media);
    }

    return `updated post ${args.id}`;
  }
}

export default UpdatePostResolver;
