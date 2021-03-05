import { Resolver, Query, ArgsType, Field, Float, Args, Ctx } from 'type-graphql';
import { elasticClient } from '../elastic/init';
import { userIndexName } from '../elastic/settings';
import { Min, isEmail, Matches, IsOptional, IsIn } from 'class-validator';
import { SearchUser, SearchUsersResult, UserSortOption, UserType } from '../schema/users/user.entity';
import { locationRegex } from '../shared/variables';
import majors from '../shared/majors';
import esb from 'elastic-builder';
import { PaginationArgs } from '../schema/utils/pagination';
import { verifyVisitor } from '../auth/checkAuth';
import { GraphQLContext } from '../utils/context';

@ArgsType()
class UsersArgs extends PaginationArgs {
  @Field(_type => String, { description: 'search query', nullable: true })
  @IsOptional()
  query?: string;

  @Field(_type => [UserType], { description: 'user type', nullable: true, defaultValue: [] })
  @IsOptional()
  types: UserType[];

  @Field(_type => [String], { description: 'user major', nullable: true, defaultValue: [] })
  @IsOptional()
  @IsIn(majors, {
    message: 'major must be in list of allowed majors',
    each: true
  })
  majors: string[];

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
}

@Resolver()
class UsersResolver {
  @Query(_returns => SearchUsersResult)
  async users(@Args() args: UsersArgs, @Ctx() ctx: GraphQLContext): Promise<SearchUsersResult> {
    if (!verifyVisitor(ctx) || !ctx.auth) {
      throw new Error('user not logged in');
    }

    const mustShouldParams: esb.Query[] = [];
    const filterMustParams: esb.Query[] = [];

    if (args.query) {
      args.query = args.query.toLowerCase();
      mustShouldParams.push(esb.matchQuery('name', args.query).fuzziness('AUTO'));
      if (isEmail(args.query)) {
        mustShouldParams.push(esb.matchQuery('email', args.query));
      }
      mustShouldParams.push(esb.matchQuery('username', args.query));
      mustShouldParams.push(esb.matchQuery('locationName', args.query).fuzziness('AUTO'));
    }
    const filterTypeParams: esb.Query[] = [];
    for (const type of args.types) {
      filterTypeParams.push(esb.termQuery('type', type));
    }
    const filterMajorParams: esb.Query[] = [];
    for (const major of args.majors) {
      filterMajorParams.push(esb.termQuery('major', major));
    }
    if (args.location) {
      filterMustParams.push(esb.geoDistanceQuery('location',
        esb.geoPoint().string(args.location)).distance(`${args.distance}km`));
    }

    let requestBody = esb.requestBodySearch().query(
      esb.boolQuery()
        .must(
          esb.boolQuery()
            .should(mustShouldParams)
        )
        .filter(
          esb.boolQuery()
            .should(filterTypeParams)
            .should(filterMajorParams)
            .must(filterMustParams)
        )
    );
    if (args.sortBy) {
      requestBody = requestBody.sort(esb.sort(args.sortBy,
        args.ascending ? 'asc' : 'desc'));
    }
    requestBody = requestBody.from(args.page).size(args.perpage);

    const elasticUserData = await elasticClient.search({
      index: userIndexName,
      body: requestBody.toJSON()
    });
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
      count: elasticUserData.body.hits.total.value
    };
  }
}

export default UsersResolver;
