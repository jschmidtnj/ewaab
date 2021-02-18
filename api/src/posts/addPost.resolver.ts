import { Resolver, ArgsType, Field, Args, Mutation, Ctx } from 'type-graphql';
import { MinLength, IsUrl, IsOptional } from 'class-validator';
import { getRepository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { elasticClient } from '../elastic/init';
import { postIndexName } from '../elastic/settings';
import Post, { PostType, SearchPost } from '../schema/posts/post.entity';
import { postMediaWidth, strMinLen } from '../shared/variables';
import { verifyLoggedIn } from '../auth/checkAuth';
import { GraphQLContext } from '../utils/context';
import User, { UserType } from '../schema/users/user.entity';
import { GraphQLUpload, FileUpload } from 'graphql-upload';
import { blurredWidth, maxFileUploadSize } from '../utils/variables';
import Media, { MediaParentType } from '../schema/media/media.entity';
import sharp from 'sharp';
import { s3Client, fileBucket, getMediaKey } from '../utils/aws';
import { imageMime } from '../utils/misc';
import { ApolloError } from 'apollo-server-express';
import statusCodes from 'http-status-codes';
import { getTime } from '../shared/time';

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

  @Field(_type => String, { description: 'link', nullable: true })
  @IsOptional()
  @IsUrl({}, {
    message: 'invalid link provided'
  })
  link?: string;

  @Field(_type => GraphQLUpload, { description: 'media', nullable: true })
  @IsOptional()
  media?: Promise<FileUpload>;
}

const userAccessMap: Record<UserType, PostType[]> = {
  [UserType.admin]: Object.values(PostType),
  [UserType.user]: [PostType.community],
  [UserType.mentor]: [PostType.mentorNews],
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
      throw new Error(`user of type ${ctx.auth.type} not authorized to post ${args.type}`);
    }

    const UserModel = getRepository(User);
    const currentUser = await UserModel.findOne(ctx.auth.id, {
      select: ['name', 'avatar']
    });
    if (!currentUser) {
      throw new ApolloError('could not get current user', `${statusCodes.INTERNAL_SERVER_ERROR}`);
    }

    const id = uuidv4();

    return new Promise<string>(async (resolve, reject) => {
      const callback = async (mediaID: string | undefined) => {
        const PostModel = getRepository(Post);
        const now = getTime();
        const searchPost: SearchPost = {
          title: args.title,
          content: args.content,
          type: args.type,
          created: now,
          updated: now,
          publisher: ctx.auth!.id,
          media: mediaID
        };

        await elasticClient.index({
          id,
          index: postIndexName,
          body: searchPost
        });
        const newPost = await PostModel.save({
          ...searchPost,
          id,
        });

        return `created post ${newPost.id}`;
      };

      let numReading = 0;

      if (args.media) {
        numReading++;

        const mediaFile = await args.media;
        const mediaReadStream = mediaFile.createReadStream();
        if (mediaReadStream.readableLength > maxFileUploadSize) {
          reject(new Error(`media file ${mediaFile.filename} is larger than the max file size of ${maxFileUploadSize} bytes`));
          return;
        }
        const data: Uint8Array[] = [];
        mediaReadStream.on('data', (chunk: Uint8Array) => data.push(chunk));
        mediaReadStream.on('error', reject);
        mediaReadStream.on('end', () => {
          let buffer = Buffer.concat(data);
          const MediaModel = getRepository(Media);
          (async () => {
            const newMedia = await MediaModel.save({
              id: uuidv4(),
              fileSize: mediaReadStream.readableLength,
              mime: mediaFile.mimetype,
              name: mediaFile.filename,
              parent: id,
              parentType: MediaParentType.post,
            });

            if (mediaFile.mimetype.startsWith(imageMime)) {
              const blurred = await sharp(buffer).blur().resize(blurredWidth).toBuffer();
              // upload blurred
              await s3Client.upload({
                Bucket: fileBucket,
                Key: getMediaKey(newMedia.id, true),
                Body: blurred,
                ContentType: mediaFile.mimetype,
                ContentEncoding: mediaFile.encoding,
              }).promise();

              const original = await sharp(buffer).resize(postMediaWidth).toBuffer();
              buffer = original;
            }

            // upload original / buffer
            await s3Client.upload({
              Bucket: fileBucket,
              Key: getMediaKey(newMedia.id),
              Body: buffer,
              ContentType: mediaFile.mimetype,
              ContentEncoding: mediaFile.encoding,
            }).promise();

            numReading--;
            if (numReading === 0) {
              resolve(await callback(newMedia.id));
            }
          })();
        });
        mediaReadStream.read();
      }

      if (numReading === 0) {
        resolve(await callback(undefined));
      }
    });
  }
}

export default AddPostResolver;
