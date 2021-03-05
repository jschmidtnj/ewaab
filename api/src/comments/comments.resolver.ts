import { Resolver, Query, ArgsType, Field, Args, Ctx } from 'type-graphql';
import { elasticClient } from '../elastic/init';
import { commentIndexName } from '../elastic/settings';
import { Matches, IsOptional } from 'class-validator';
import { uuidRegex } from '../shared/variables';
import esb from 'elastic-builder';
import { CommentSortOption, SearchComment } from '../schema/posts/comment.entity';
import { AuthAccessType, checkPostAccess } from '../auth/checkAuth';
import { GraphQLContext } from '../utils/context';
import { PaginationArgs } from '../schema/utils/pagination';

@ArgsType()
export class PostCommentsArgs extends PaginationArgs {
  @Field(_type => String, { description: 'search query', nullable: true })
  @IsOptional()
  query?: string;

  @Field(_type => CommentSortOption, { description: 'sort by this field', nullable: true })
  @IsOptional()
  sortBy?: CommentSortOption;

  @Field(_type => Boolean, { description: 'sort direction', nullable: true, defaultValue: true })
  ascending: boolean;
}

@ArgsType()
class CommentsArgs extends PostCommentsArgs {
  @Field(_type => String, { description: 'post id' })
  @Matches(uuidRegex, {
    message: 'invalid post id provided, must be uuid v4'
  })
  post: string;
}

export const searchComments = async (args: PostCommentsArgs, post: string): Promise<SearchComment[]> => {
  const mustShouldParams: esb.Query[] = [];
  const filterMustParams: esb.Query[] = [];

  if (args.query) {
    args.query = args.query.toLowerCase();
    mustShouldParams.push(esb.matchQuery('content', args.query).fuzziness('AUTO'));
  }

  filterMustParams.push(esb.termQuery('post', post));

  let requestBody = esb.requestBodySearch().query(
    esb.boolQuery()
      .must(
        esb.boolQuery()
          .should(mustShouldParams)
      )
      .filter(filterMustParams)
  );
  if (args.sortBy) {
    requestBody = requestBody.sort(esb.sort(args.sortBy,
      args.ascending ? 'asc' : 'desc'));
  }
  requestBody = requestBody.from(args.page).size(args.perpage);

  const elasticCommentData = await elasticClient.search({
    index: commentIndexName,
    body: requestBody.toJSON()
  });
  const results: SearchComment[] = [];
  for (const hit of elasticCommentData.body.hits.hits) {
    const currentComment: SearchComment = {
      ...hit._source as SearchComment,
      id: hit._id as string,
    };
    results.push(currentComment);
  }
  return results;
};

@Resolver()
class CommentsResolver {
  @Query(_returns => [SearchComment])
  async comments(@Args() args: CommentsArgs, @Ctx() ctx: GraphQLContext): Promise<SearchComment[]> {
    if (!await checkPostAccess({
      ctx,
      accessType: AuthAccessType.view,
      id: args.post
    })) {
      throw new Error(`user of type ${ctx.auth!.type} not authorized to view post ${args.post}`);
    }

    return await searchComments(args, args.post);
  }
}

export default CommentsResolver;
