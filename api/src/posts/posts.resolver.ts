import { Resolver, Query, Ctx, ArgsType, Field, Int, Args } from 'type-graphql';
import { elasticClient } from '../elastic/init';
import { postIndexName } from '../elastic/settings';
import { RequestParams } from '@elastic/elasticsearch';
import { GraphQLContext } from '../utils/context';
import { verifyLoggedIn } from '../auth/checkAuth';
import { Min, Max, IsOptional } from 'class-validator';
import { PostSortOption, PostType, SearchPost, SearchPostsResult } from '../schema/posts/post.entity';
import { postViewMap } from './post.resolver';
import esb from 'elastic-builder';

const maxPerPage = 20;

@ArgsType()
export class PostsArgs {
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

const buildFilters = (mustShouldParams: esb.Query[], filterParams: esb.Query[]): esb.BoolQuery => {
  return esb.boolQuery()
    .must(
      esb.boolQuery()
        .should(mustShouldParams)
    )
    .filter(filterParams);
};

@Resolver()
class PostsResolver {
  @Query(_returns => SearchPostsResult)
  async posts(@Args() args: PostsArgs, @Ctx() ctx: GraphQLContext): Promise<SearchPostsResult> {
    if (!verifyLoggedIn(ctx) || !ctx.auth) {
      throw new Error('user not logged in');
    }

    const mustShouldParams: esb.Query[] = [];
    const filterParams: esb.Query[] = [];

    if (args.query) {
      mustShouldParams.push(esb.termQuery('title', args.query));
      mustShouldParams.push(esb.termQuery('content', args.query));
    }

    if (args.created !== undefined) {
      filterParams.push(esb.rangeQuery('created').gte(args.created));
    }

    if (args.type) {
      if (!postViewMap[ctx.auth.type].includes(args.type)) {
        throw new Error(`user of type ${ctx.auth.type} not authorized to find posts of type ${args.type}`);
      }
      filterParams.push(esb.termQuery('type', args.type));
    }

    const getAggregates = args.type === undefined;

    const aggregates: esb.Aggregation[] = [];

    if (getAggregates) {
      for (const postType of Object.values(PostType)) {
        const filters = [...filterParams, esb.matchQuery('type', postType)];
        aggregates.push(esb.filtersAggregation(postType).filter(postType, buildFilters(mustShouldParams, filters)));
      }
    }

    let requestBody = esb.requestBodySearch().query(buildFilters(mustShouldParams, filterParams));
    if (args.sortBy) {
      requestBody = requestBody.sort(esb.sort(args.sortBy,
        args.ascending ? 'asc' : 'desc'));
    }
    requestBody = requestBody.from(args.page).size(args.perpage);
    if (getAggregates) {
      requestBody = requestBody.aggregations(aggregates);
    }

    const searchParams: RequestParams.Search = {
      index: postIndexName,
      from: args.page,
      size: args.perpage,
      body: requestBody.toJSON()
    };

    const elasticPostData = await elasticClient.search(searchParams);
    const results: SearchPost[] = [];
    for (const hit of elasticPostData.body.hits.hits) {
      const currentPost: SearchPost = {
        ...hit._source as SearchPost,
        id: hit._id as string,
      };
      results.push(currentPost);
    }
    const totalCount = elasticPostData.body.hits.total.value;
    const counts: Record<PostType, number> = Object.values(PostType).reduce((map, type) => {
      map[type] = 0;
      return map;
    }, {} as Record<PostType, number>);

    if (!getAggregates) {
      counts[args.type!] = totalCount;
    } else {
      for (const postType of Object.values(PostType)) {
        counts[postType] = elasticPostData.body.aggregations[postType].buckets[postType].doc_count;
      }
    }

    return {
      results,
      count: totalCount,
      countEncourageHer: counts[PostType.encourageHer],
      countStudentCommunity: counts[PostType.studentCommunity],
      countMentorNews: counts[PostType.mentorNews],
      countStudentNews: counts[PostType.studentNews]
    };
  }
}

export default PostsResolver;
