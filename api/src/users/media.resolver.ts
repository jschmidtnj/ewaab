import { Resolver, ArgsType, Field, Args, Ctx, Query } from 'type-graphql';
import { GraphQLContext } from '../utils/context';
import { verifyLoggedIn } from '../auth/checkAuth';
import Media from '../schema/media/media.entity';
import { getRepository } from 'typeorm';

@ArgsType()
class MediaArgs {
  @Field({ description: 'media id', nullable: true })
  id: number;
}

export const getMedia = async (args: MediaArgs): Promise<Media> => {
  const MediaModel = getRepository(Media);
  const media = await MediaModel.findOne(args.id);
  if (!media) {
    throw new Error(`cannot find media object with id ${args.id}`);
  }
  return media;
};

export const getMediaAuthenticated = async (args: MediaArgs, ctx: GraphQLContext): Promise<Media> => {
  const media = await getMedia(args);
  if (!verifyLoggedIn(ctx) || !ctx.auth) {
    throw new Error('user not logged in');
  }
  if (ctx.auth.id !== media.user) {
    throw new Error('user not authorized to view media');
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
