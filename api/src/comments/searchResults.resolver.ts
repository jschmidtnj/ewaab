import { ResolverInterface, FieldResolver, Root, Resolver, Args, Ctx } from 'type-graphql';
import { PublisherData } from '../schema/users/user.entity';
import { SearchComment } from '../schema/posts/comment.entity';
import { getPublisherData } from '../posts/searchResults.resolver';
import { UserReactionsArgs, getUserReactions, CountReactionsArgs, getReactionCounts } from '../reactions/reactions.resolver';
import Reaction, { ReactionParentType } from '../schema/reactions/reaction.entity';
import ReactionCount from '../schema/reactions/reactionCount.entity';
import { GraphQLContext } from '../utils/context';

@Resolver(_of => SearchComment)
class SearchResultsResolver implements ResolverInterface<SearchComment> {
  @FieldResolver(_returns => PublisherData)
  async publisherData(@Root() searchResult: SearchComment): Promise<PublisherData | undefined> {
    return await getPublisherData(searchResult.publisher);
  }

  @FieldResolver(_returns => [Reaction])
  async userReactions(@Root() searchResult: SearchComment, @Args() args: UserReactionsArgs, @Ctx() ctx: GraphQLContext): Promise<Reaction[]> {
    return await getUserReactions(args, searchResult.id as string, ReactionParentType.comment, ctx.auth!.id);
  }

  @FieldResolver(_returns => [ReactionCount])
  async reactions(@Root() searchResult: SearchComment, @Args() args: CountReactionsArgs): Promise<ReactionCount[]> {
    return await getReactionCounts(args, searchResult.id as string, ReactionParentType.comment);
  }
}

export default SearchResultsResolver;
