import { ResolverInterface, FieldResolver, Root, Resolver, Args } from 'type-graphql';
import { getRepository } from 'typeorm';
import { MediaData } from '../schema/media/media.entity';
import { SearchPost } from '../schema/posts/post.entity';
import User, { PublisherData } from '../schema/users/user.entity';
import Media from '../schema/media/media.entity';
import { SearchCommentsResult } from '../schema/posts/comment.entity';
import { PostCommentsArgs, searchComments } from '../comments/comments.resolver';
import Reaction, { ReactionParentType } from '../schema/reactions/reaction.entity';
import { CountReactionsArgs, getReactionCounts, getUserReactions, UserReactionsArgs } from '../reactions/reactions.resolver';
import ReactionCount from '../schema/reactions/reactionCount.entity';

export const getPublisherData = async (publisher: string): Promise<PublisherData | undefined> => {
  const UserModel = getRepository(User);
  const userData = await UserModel.findOne(publisher, {
    select: ['id', 'name', 'username', 'avatar', 'description', 'created', 'updated']
  });
  if (!userData) {
    // user deleted
    return undefined;
  }
  return {
    ...userData
  };
};

export const getMediaData = async (media: string): Promise<MediaData> => {
  const MediaModel = getRepository(Media);
  const mediaData = await MediaModel.findOne(media, {
    select: ['id', 'mime', 'name', 'fileSize', 'type']
  });
  if (!mediaData) {
    throw new Error(`cannot find media for ${media}`);
  }
  return {
    ...mediaData
  };
};

@Resolver(_of => SearchPost)
class SearchResultsResolver implements ResolverInterface<SearchPost> {
  @FieldResolver(_returns => PublisherData)
  async publisherData(@Root() searchResult: SearchPost): Promise<PublisherData | undefined> {
    return await getPublisherData(searchResult.publisher);
  }

  @FieldResolver(_returns => MediaData)
  async mediaData(@Root() searchResult: SearchPost): Promise<MediaData | undefined> {
    if (!searchResult.media) {
      return undefined;
    }
    return await getMediaData(searchResult.media);
  }

  @FieldResolver(_returns => SearchCommentsResult)
  async comments(@Root() searchResult: SearchPost, @Args() args: PostCommentsArgs): Promise<SearchCommentsResult> {
    return await searchComments(args, searchResult.id as string);
  }

  @FieldResolver(_returns => [Reaction])
  async userReactions(@Root() searchResult: SearchPost, @Args() args: UserReactionsArgs): Promise<Reaction[]> {
    return await getUserReactions(args, searchResult.id as string, ReactionParentType.post);
  }

  @FieldResolver(_returns => [ReactionCount])
  async reactions(@Root() searchResult: SearchPost, @Args() args: CountReactionsArgs): Promise<ReactionCount[]> {
    return await getReactionCounts(args, searchResult.id as string, ReactionParentType.post);
  }
}

export default SearchResultsResolver;
