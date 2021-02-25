import { ResolverInterface, FieldResolver, Root, Resolver, Args } from 'type-graphql';
import { PublisherData } from '../schema/users/user.entity';
import { SearchComment } from '../schema/posts/comment.entity';
import { getPublisherData } from '../posts/searchResults.resolver';
import { UserReactionsArgs, getUserReactions, CountReactionsArgs, getReactionCounts } from '../reactions/reactions.resolver';
import { SearchPost } from '../schema/posts/post.entity';
import Reaction, { ReactionParentType } from '../schema/reactions/reaction.entity';
import ReactionCount from '../schema/reactions/reactionCount.entity';

@Resolver(_of => SearchComment)
class SearchResultsResolver implements ResolverInterface<SearchComment> {
  @FieldResolver(_returns => PublisherData)
  async publisherData(@Root() searchResult: SearchComment): Promise<PublisherData | undefined> {
    return await getPublisherData(searchResult.publisher);
  }

  @FieldResolver(_returns => [Reaction])
  async userReactions(@Root() searchResult: SearchPost, @Args() args: UserReactionsArgs): Promise<Reaction[]> {
    return await getUserReactions(args, searchResult.id as string, ReactionParentType.comment);
  }

  @FieldResolver(_returns => [ReactionCount])
  async reactions(@Root() searchResult: SearchPost, @Args() args: CountReactionsArgs): Promise<ReactionCount[]> {
    return await getReactionCounts(args, searchResult.id as string, ReactionParentType.comment);
  }
}

export default SearchResultsResolver;
