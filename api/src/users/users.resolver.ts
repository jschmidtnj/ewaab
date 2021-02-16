import { Resolver, Query, Ctx, ArgsType, Field, Int, Float, Args } from 'type-graphql';
import { elasticClient } from '../elastic/init';
import { userIndexName } from '../elastic/settings';
import { RequestParams } from '@elastic/elasticsearch';
import { GraphQLContext } from '../utils/context';
import { verifyLoggedIn } from '../auth/checkAuth';
import { Min, Max, isEmail, Matches, ArrayContains, IsOptional } from 'class-validator';
import { SearchUser, SearchUsersResult, UserSortOption } from '../schema/users/user.entity';
import { locationRegex, UserType } from '../shared/variables';
import majors from '../shared/majors';

const maxPerPage = 20;

@ArgsType()
export class UsersArgs {
  @Field(_type => String, { description: 'search query', nullable: true })
  @IsOptional()
  query?: string;

  @Field(_type => UserType, { description: 'user type', nullable: true })
  @IsOptional()
  type?: UserType;

  @Field(_type => [String], { description: 'user major', nullable: true })
  @IsOptional()
  @ArrayContains(majors, {
    message: 'major must be in list of allowed majors'
  })
  majors?: string[];

  @Field(_type => String, { description: 'relative location', nullable: true })
  @IsOptional()
  @Matches(locationRegex, {
    message: 'invalid relative location provided'
  })
  location?: string;

  @Field(_type => Float, {
    description: 'distance (km)',
    nullable: true,
    defaultValue: 100
  })
  @Min(0, {
    message: 'distance must be greater than 0'
  })
  distance: number;

  @Field(_type => UserSortOption, { description: 'sort by this field', nullable: true })
  @IsOptional()
  sortBy?: UserSortOption;

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

@Resolver()
class UsersResolver {
  @Query(_returns => SearchUsersResult)
  async users(@Args() args: UsersArgs, @Ctx() ctx: GraphQLContext): Promise<SearchUsersResult> {
    if (!verifyLoggedIn(ctx) || !ctx.auth) {
      throw new Error('user not logged in');
    }

    const shouldParams: Record<string, unknown>[] = [];
    const filterShouldParams: Record<string, unknown>[] = [];
    const filterMustParams: Record<string, unknown>[] = [];

    if (args.query) {
      shouldParams.push({
        term: {
          name: args.query
        }
      });
      if (isEmail(args.query)) {
        shouldParams.push({
          term: {
            email: args.query
          }
        });
      }
      shouldParams.push({
        term: {
          username: args.query
        }
      });
      shouldParams.push({
        term: {
          location: args.query
        }
      });
    }
    if (args.type) {
      filterMustParams.push({
        term: {
          type: args.type
        }
      });
    }
    if (args.majors) {
      for (const major of args.majors) {
        filterShouldParams.push({
          term: {
            major
          }
        });
      }
    }
    if (args.location) {
      filterMustParams.push({
        geo_distance: {
          distance: `${args.distance}km`,
          location: args.location
        }
      });
    }

    const sort: Record<string, string>[] = [];
    if (args.sortBy) {
      sort.push({
        [args.sortBy]: args.ascending ? 'asc' : 'desc'
      });
    }

    const searchParams: RequestParams.Search = {
      index: userIndexName,
      from: args.page,
      size: args.perpage,
      body: {
        sort,
        query: {
          bool: {
            should: shouldParams,
            filter: {
              bool: {
                should: filterShouldParams,
                must: filterMustParams
              }
            }
          }
        }
      }
    };

    const elasticUserData = await elasticClient.search(searchParams);
    const results: SearchUser[] = [];
    for (const hit of elasticUserData.body.hits.hits) {
      const currentUser: SearchUser = {
        ...hit._source as SearchUser,
        id: hit._id as string,
      };
      results.push(currentUser);
    }
    return {
      results,
      count: elasticUserData.body.hits.total
    };
  }
}

export default UsersResolver;
