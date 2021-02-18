import { GraphQLContext } from '../utils/context';
import { Resolver, ArgsType, Field, Args, Ctx, Mutation } from 'type-graphql';
import { MinLength, IsOptional, IsUrl } from 'class-validator';
import { postMediaWidth, strMinLen } from '../shared/variables';
import { verifyLoggedIn } from '../auth/checkAuth';
import { getRepository } from 'typeorm';
import { QueryPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import statusCodes from 'http-status-codes';
import { GraphQLUpload, FileUpload } from 'graphql-upload';
import { elasticClient } from '../elastic/init';
import { postIndexName } from '../elastic/settings';
import Post from '../schema/posts/post.entity';
import { UserType } from '../schema/users/user.entity';
import sharp from 'sharp';
import Media, { MediaParentType } from '../schema/media/media.entity';
import { s3Client, fileBucket, getMediaKey } from '../utils/aws';
import { imageMime } from '../utils/misc';
import { maxFileUploadSize, blurredWidth } from '../utils/variables';
import { ApolloError } from 'apollo-server-express';
import { deleteMedia } from '../users/media.resolver';
import { v4 as uuidv4 } from 'uuid';
import { getTime } from '../shared/time';

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
    if (!Object.values(Object.assign({}, args, { deleteMedia: undefined })).some(elem => elem !== undefined)) {
      throw new ApolloError('no updates found', `${statusCodes.BAD_REQUEST}`);
    }
    const postUpdateData: QueryPartialEntity<Post> = {};
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
    const now = getTime();
    postUpdateData.updated = now;

    return new Promise<string>(async (resolve, reject) => {
      const callback = async () => {
        await PostModel.update(args.id, postUpdateData);
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
              parent: args.id,
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
              resolve(await callback());
            }
          })();
        });
        mediaReadStream.read();
      }

      if (numReading === 0) {
        resolve(await callback());
      }
    });
  }
}

export default UpdatePostResolver;
