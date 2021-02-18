import { Resolver, ArgsType, Field, Args, Ctx, Query } from 'type-graphql';
import { GraphQLContext } from '../utils/context';
import { checkPostAccess, verifyLoggedIn } from '../auth/checkAuth';
import Media, { MediaParentType } from '../schema/media/media.entity';
import { getRepository } from 'typeorm';
import { fileBucket, getMediaKey, s3Client } from '../utils/aws';
import { MediaAccessTokenData } from './user.resolver';
import { loginType } from '../auth/shared';

@ArgsType()
class MediaArgs {
  @Field({ description: 'media id' })
  id: string;
}

export const deleteMedia = async (id: string): Promise<boolean> => {
  const MediaModel = getRepository(Media);
  await MediaModel.delete(id);
  await s3Client.deleteObject({
    Bucket: fileBucket,
    Key: getMediaKey(id),
  }).promise();
  return true;
};

export const getMedia = async (args: MediaArgs): Promise<Media> => {
  const MediaModel = getRepository(Media);
  const media = await MediaModel.findOne(args.id);
  if (!media) {
    throw new Error(`cannot find media object with id ${args.id}`);
  }
  return media;
};

export const getMediaAuthenticated = async (args: MediaArgs, ctx: GraphQLContext, tokenData?: MediaAccessTokenData): Promise<Media> => {
  const media = await getMedia(args);
  if (tokenData) {
    ctx.auth = {
      emailVerified: true,
      id: tokenData.id,
      loginType: loginType.LOCAL,
      type: tokenData.userType
    };
  }
  if (media.parentType === MediaParentType.user) {
    return media;
  }

  if (tokenData === undefined && !verifyLoggedIn(ctx) || !ctx.auth) {
    throw new Error('user not logged in');
  }
  if (media.parentType === MediaParentType.post) {
    if (!checkPostAccess(ctx, media.parent)) {
      throw new Error(`user does not have access to post ${media.parent}`);
    }
  } else {
    throw new Error(`unhandled media type ${media.parentType}`);
  }
  return media;
};

@Resolver()
class MediaResolver {
  @Query(_returns => Media)
  async media(@Args() args: MediaArgs, @Ctx() ctx: GraphQLContext): Promise<Media> {
    return await getMediaAuthenticated(args, ctx);
  }
}

export default MediaResolver;
