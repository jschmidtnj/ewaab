import { Resolver, Query, Ctx, ArgsType, Field, Int, Args } from 'type-graphql';
import { elasticClient } from '../elastic/init';
import { postIndexName } from '../elastic/settings';
import { RequestParams } from '@elastic/elasticsearch';
import { GraphQLContext } from '../utils/context';
import { verifyLoggedIn } from '../auth/checkAuth';
import { IsOptional, Matches, ValidateIf } from 'class-validator';
import { PostCount, PostSortOption, PostType, BaseSearchPost, SearchPostsResult } from '../schema/posts/post.entity';
import esb from 'elastic-builder';
import { uuidRegex } from '../shared/variables';
import { postViewMap } from '../utils/variables';
import { PaginationArgs } from '../schema/utils/pagination';

@ArgsType()
class PostsArgs extends PaginationArgs {
  @Field(_type => String, { description: 'search query', nullable: true })
  @IsOptional()
  query?: string;

  @Field(_type => PostType, { description: 'post type', nullable: true })
  @IsOptional()
  type?: PostType;

  @Field(_type => Int, { description: 'created after this date', nullable: true })
  @IsOptional()
  created?: number;

  @Field(_type => PostSortOption, { description: 'sort by this field', defaultValue: PostSortOption.created })
  sortBy: PostSortOption;

  @Field(_type => Boolean, { description: 'sort direction', nullable: true, defaultValue: true })
  ascending: boolean;

  @Field(_type => [PostType], { description: 'post counts', nullable: true })
  postCounts?: PostType[];

  @Field(_type => String, { description: 'user who published the post', nullable: true })
  @IsOptional()
  @ValidateIf((_obj, val?: string) => val !== undefined && val.length > 0)
  @Matches(uuidRegex, {
    message: 'invalid user id provided, must be uuid v4'
  })
  publisher?: string;
}

const buildFilters = (mustShouldParams: esb.Query[], filterMustParams: esb.Query[],
  filterShouldParams: esb.Query[]): esb.BoolQuery => {
  return esb.boolQuery()
    .must(
      esb.boolQuery()
        .should(mustShouldParams)
    )
    .filter(
      esb.boolQuery()
        .should(filterShouldParams)
        .must(filterMustParams)
    );
};

@Resolver()
class PostsResolver {
  @Query(_returns => SearchPostsResult)
  async posts(@Args() args: PostsArgs, @Ctx() ctx: GraphQLContext): Promise<SearchPostsResult> {
    if (!verifyLoggedIn(ctx) || !ctx.auth) {
      throw new Error('user not logged in');
    }

    const mustShouldParams: esb.Query[] = [];
    const filterMustParams: esb.Query[] = [];
    let filterShouldParams: esb.Query[] = [];

    if (args.query) {
      args.query = args.query.toLowerCase();
      mustShouldParams.push(esb.matchQuery('title', args.query).fuzziness('AUTO'));
      mustShouldParams.push(esb.matchQuery('content', args.query).fuzziness('AUTO'));
    }

    if (args.publisher !== undefined) {
      filterMustParams.push(esb.termQuery('publisher', args.publisher));
    }

    if (args.created !== undefined) {
      filterMustParams.push(esb.rangeQuery('created').gte(args.created));
    }

    if (args.type) {
      if (!postViewMap[ctx.auth.type].includes(args.type)) {
        throw new Error(`user of type ${ctx.auth.type} not authorized to find posts of type ${args.type}`);
      }
      filterShouldParams.push(esb.termQuery('type', args.type));
    } else {
      filterShouldParams = filterShouldParams.concat(postViewMap[ctx.auth.type]
        .map(post_type => esb.termQuery('type', post_type)));
    }

    if (args.postCounts === undefined) {
      args.postCounts = postViewMap[ctx.auth.type];
    } else if (args.postCounts.some(postType => !postViewMap[ctx.auth!.type].includes(postType))) {
      throw new Error(`user of type ${ctx.auth!.type} not authorized to aggregate over given post types`);
    }

    const aggregates: esb.Aggregation[] = [];

    for (const postType of postViewMap[ctx.auth.type]) {
      const filters = [...filterMustParams, esb.matchQuery('type', postType)];
      aggregates.push(esb.filtersAggregation(postType).filter(postType, buildFilters(mustShouldParams, filters, filterShouldParams)));
    }

    let requestBody = esb.requestBodySearch().query(buildFilters(mustShouldParams, filterMustParams, filterShouldParams));
    if (args.sortBy) {
      requestBody = requestBody.sort(esb.sort(args.sortBy,
        args.ascending ? 'asc' : 'desc'));
    }
    requestBody = requestBody.from(args.page * args.perpage).size(args.perpage).aggregations(aggregates);
    // TODO - fix pagination!

    const searchParams: RequestParams.Search = {
      index: postIndexName,
      from: args.page,
      size: args.perpage,
      body: requestBody.toJSON()
    };

    const elasticPostData = await elasticClient.search(searchParams);
    const results: BaseSearchPost[] = [];
    for (const hit of elasticPostData.body.hits.hits) {
      const currentPost: BaseSearchPost = {
        ...hit._source as BaseSearchPost,
        id: hit._id as string,
      };
      results.push(currentPost);
    }
    const totalCount = elasticPostData.body.hits.total.value;
    let counts: PostCount[] = [];

    for (const postType of args.postCounts) {
      const count: number = elasticPostData.body.aggregations[postType].buckets[postType].doc_count;
      counts.push({
        count,
        type: postType
      });
    }
    counts = counts.reverse();

    return {
      results,
      count: totalCount,
      postCounts: counts
    };
  }
}

export default PostsResolver;
