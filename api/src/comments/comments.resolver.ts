import { Resolver, Query, ArgsType, Field, Int, Args, Ctx } from 'type-graphql';
import { elasticClient } from '../elastic/init';
import { commentIndexName } from '../elastic/settings';
import { Min, Max, Matches, IsOptional } from 'class-validator';
import { uuidRegex } from '../shared/variables';
import esb from 'elastic-builder';
import { CommentSortOption, SearchComment, SearchCommentsResult } from '../schema/posts/comment.entity';
import { AuthAccessType, checkPostAccess } from '../auth/checkAuth';
import { GraphQLContext } from '../utils/context';

const maxPerPage = 20;

@ArgsType()
export class PostCommentsArgs {
  @Field(_type => String, { description: 'search query', nullable: true })
  @IsOptional()
  query?: string;

  @Field(_type => CommentSortOption, { description: 'sort by this field', nullable: true })
  @IsOptional()
  sortBy?: CommentSortOption;

  @Field(_type => Boolean, { description: 'sort direction', nullable: true, defaultValue: true })
  ascending: boolean;

  @Min(0, {
    message: 'page number must be greater than or equal to 0'
  })
  @Field(_type => Int, {
    description: 'page number',
    nullable: true,
    defaultValue: 0
  })
  page: number;

  @Min(1, {
    message: 'per page must be greater than or equal to 1'
  })
  @Max(maxPerPage, {
    message: `per page must be less than or equal to ${maxPerPage}`
  })
  @Field(_type => Int, {
    description: 'number per page',
    nullable: true,
    defaultValue: 10
  })
  perpage: number;
}

@ArgsType()
class CommentsArgs extends PostCommentsArgs {
  @Field(_type => String, { description: 'post id' })
  @Matches(uuidRegex, {
    message: 'invalid post id provided, must be uuid v4'
  })
  post: string;
}

export const searchComments = async (args: PostCommentsArgs, post: string): Promise<SearchCommentsResult> => {
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
  return {
    results,
    count: elasticCommentData.body.hits.total.value
  };
};

@Resolver()
class CommentsResolver {
  @Query(_returns => SearchCommentsResult)
  async comments(@Args() args: CommentsArgs, @Ctx() ctx: GraphQLContext): Promise<SearchCommentsResult> {
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
