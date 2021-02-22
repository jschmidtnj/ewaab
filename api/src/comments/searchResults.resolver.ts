import { ResolverInterface, FieldResolver, Root, Resolver } from 'type-graphql';
import { PublisherData } from '../schema/users/user.entity';
import { SearchComment } from '../schema/posts/comment.entity';
import { getPublisherData } from '../posts/searchResults.resolver';

@Resolver(_of => SearchComment)
class SearchResultsResolver implements ResolverInterface<SearchComment> {
  @FieldResolver(_returns => PublisherData)
  async publisherData(@Root() searchResult: SearchComment): Promise<PublisherData | undefined> {
    return await getPublisherData(searchResult.publisher);
  }
}

export default SearchResultsResolver;
