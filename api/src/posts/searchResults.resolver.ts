import { ResolverInterface, FieldResolver, Root, Resolver } from 'type-graphql';
import { getRepository } from 'typeorm';
import { MediaData } from '../schema/media/media.entity';
import { SearchPost } from '../schema/posts/post.entity';
import User, { PostPublisherData } from '../schema/users/user.entity';
import Media from '../schema/media/media.entity';

@Resolver(_of => SearchPost)
class SearchResultsResolver implements ResolverInterface<SearchPost> {
  @FieldResolver(_returns => PostPublisherData)
  async publisherData(@Root() searchResult: SearchPost): Promise<PostPublisherData | undefined> {
    const UserModel = getRepository(User);
    const userData = await UserModel.findOne(searchResult.publisher, {
      select: ['id', 'name', 'username', 'avatar', 'description', 'created', 'updated']
    });
    if (!userData) {
      // user deleted
      return undefined;
    }
    return {
      ...userData
    };
  }

  @FieldResolver(_returns => MediaData)
  async mediaData(@Root() searchResult: SearchPost): Promise<MediaData | undefined> {
    const MediaModel = getRepository(Media);
    if (!searchResult.media) {
      return undefined;
    }
    const mediaData = await MediaModel.findOne(searchResult.media, {
      select: ['id', 'mime', 'name', 'fileSize', 'type']
    });
    if (!mediaData) {
      throw new Error(`cannot find media for ${searchResult.media}`);
    }
    return {
      ...mediaData
    };
  }
}

export default SearchResultsResolver;
