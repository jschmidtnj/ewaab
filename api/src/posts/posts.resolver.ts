import { Resolver, Query, Ctx, ArgsType, Field, Int, Args } from 'type-graphql';
import { elasticClient } from '../elastic/init';
import { postIndexName } from '../elastic/settings';
import { RequestParams } from '@elastic/elasticsearch';
import { GraphQLContext } from '../utils/context';
import { verifyLoggedIn } from '../auth/checkAuth';
import { Min, Max, IsOptional } from 'class-validator'; import { PostType } from '../shared/variables';
import { SearchPost, SearchPostsResult } from '../schema/posts/post.entity';
import { postViewMap } from './post.resolver';

const maxPerPage = 20;

@ArgsType()
export class PostsArgs {
  @Field(_type => String, { description: 'search query', nullable: true })
  @IsOptional()
  query?: string;

  @Field(_type => PostType, { description: 'post type', nullable: true })
  @IsOptional()
  type?: PostType;

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

@Resolver()
class PostsResolver {
  @Query(_returns => SearchPostsResult)
  async posts(@Args() args: PostsArgs, @Ctx() ctx: GraphQLContext): Promise<SearchPostsResult> {
    if (!verifyLoggedIn(ctx) || !ctx.auth) {
      throw new Error('user not logged in');
    }

    const shouldParams: Record<string, unknown>[] = [];
    const filterParams: Record<string, unknown>[] = [];

    if (args.query) {
      shouldParams.push({
        term: {
          title: args.query
        }
      });
      shouldParams.push({
        term: {
          content: args.query
        }
      });
    }

    if (args.type) {
      if (!postViewMap[ctx.auth.type].includes(args.type)) {
        throw new Error(`user of type ${ctx.auth.type} not authorized to find posts of type ${args.type}`);
      }
      filterParams.push({
        term: {
          type: args.type
        }
      });
    }

    const filters: Record<string, unknown> = {
      bool: {
        should: shouldParams,
        filter: filterParams,
      }
    };

    const getAggregates = args.type === undefined;

    let aggregates: Record<string, unknown> = {};

    if (getAggregates) {
      aggregates = Object.values(PostType).reduce((map, type) => {
        filterParams.push({
          match: {
            type
          }
        })
        map[type] = {
          filters: {
            filters
          }
        };
        filterParams.pop();
        return map;
      }, {} as Record<string, unknown>);
    }

    const searchParams: RequestParams.Search = {
      index: postIndexName,
      from: args.page,
      size: args.perpage,
      body: {
        query: {
          bool: {
            should: shouldParams,
            filter: filterParams,
          }
        },
        aggs: aggregates
      }
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
    const totalCount = elasticPostData.body.hits.total;
    const counts: Record<PostType, number> = Object.values(PostType).reduce((map, type) => {
      map[type] = 0;
      return map;
    }, {} as Record<PostType, number>);

    if (!getAggregates) {
      counts[args.type!] = totalCount;
    } else {
      for (const type of Object.values(PostType)) {
        counts[type] = elasticPostData.body.aggregations[type];
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
