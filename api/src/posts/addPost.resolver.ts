import { Resolver, ArgsType, Field, Args, Mutation, Ctx } from 'type-graphql';
import { MinLength, IsUrl, IsOptional } from 'class-validator';
import { getRepository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { elasticClient } from '../elastic/init';
import { postIndexName } from '../elastic/settings';
import Post, { PostType, SearchPost } from '../schema/posts/post.entity';
import { postMediaWidth, strMinLen } from '../shared/variables';
import { AuthAccessType, checkPostAccess } from '../auth/checkAuth';
import { GraphQLContext } from '../utils/context';
import User from '../schema/users/user.entity';
import { GraphQLUpload, FileUpload } from 'graphql-upload';
import { blurredWidth, maxFileUploadSize } from '../utils/variables';
import Media, { MediaParentType, MediaType } from '../schema/media/media.entity';
import sharp from 'sharp';
import { s3Client, fileBucket, getMediaKey } from '../utils/aws';
import { imageMime } from '../utils/misc';
import { ApolloError } from 'apollo-server-express';
import statusCodes from 'http-status-codes';

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

export const handlePostMedia = (postID: string, media?: Promise<FileUpload>): Promise<string | undefined> => {
  let numReading = 0;
  return new Promise<string | undefined>(async (resolve, reject) => {
    if (media) {
      numReading++;
      const mediaFile = await media;
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
          const mediaID = uuidv4();
          let mediaType: MediaType;

          if (mediaFile.mimetype.startsWith(imageMime)) {
            mediaType = MediaType.image;

            const blurred = await sharp(buffer).blur().resize(blurredWidth).toBuffer();
            // upload blurred
            await s3Client.upload({
              Bucket: fileBucket,
              Key: getMediaKey(mediaID, true),
              Body: blurred,
              ContentType: mediaFile.mimetype,
              ContentEncoding: mediaFile.encoding,
            }).promise();

            const original = await sharp(buffer).resize(postMediaWidth).toBuffer();
            buffer = original;
          } else {
            mediaType = MediaType.file;
          }

          // upload original / buffer
          await s3Client.upload({
            Bucket: fileBucket,
            Key: getMediaKey(mediaID),
            Body: buffer,
            ContentType: mediaFile.mimetype,
            ContentEncoding: mediaFile.encoding,
          }).promise();

          const newMedia = await MediaModel.save({
            id: mediaID,
            fileSize: mediaReadStream.readableLength,
            mime: mediaFile.mimetype,
            name: mediaFile.filename,
            parent: postID,
            parentType: MediaParentType.post,
            type: mediaType,
          });

          numReading--;
          if (numReading === 0) {
            resolve(newMedia.id);
          }
        })();
      });
      mediaReadStream.read();
    } else {
      resolve(undefined);
    }
  });
};

@Resolver()
class AddPostResolver {
  @Mutation(_returns => String)
  async addPost(@Args() args: AddPostArgs, @Ctx() ctx: GraphQLContext): Promise<string> {
    if (!await checkPostAccess({
      ctx,
      accessType: AuthAccessType.add,
      postType: args.type
    })) {
      throw new Error(`user of type ${ctx.auth!.type} not authorized to post ${args.type}`);
    }

    const UserModel = getRepository(User);
    const currentUser = await UserModel.findOne(ctx.auth!.id, {
      select: ['name', 'avatar']
    });
    if (!currentUser) {
      throw new ApolloError('could not get current user', `${statusCodes.INTERNAL_SERVER_ERROR}`);
    }

    const id = uuidv4();
    const mediaID = await handlePostMedia(id, args.media);

    const PostModel = getRepository(Post);
    const now = new Date().getTime();
    const searchPost: SearchPost = {
      title: args.title,
      content: args.content,
      type: args.type,
      created: now,
      updated: now,
      publisher: ctx.auth!.id,
      media: mediaID,
      link: args.link,
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
  }
}

export default AddPostResolver;
