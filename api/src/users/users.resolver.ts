import { Resolver, Query, ArgsType, Field, Int, Float, Args } from 'type-graphql';
import { elasticClient } from '../elastic/init';
import { userIndexName } from '../elastic/settings';
import { Min, Max, isEmail, Matches, IsOptional, IsIn } from 'class-validator';
import { SearchUser, SearchUsersResult, UserSortOption, UserType } from '../schema/users/user.entity';
import { locationRegex } from '../shared/variables';
import majors from '../shared/majors';
import esb from 'elastic-builder';

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
  @IsIn(majors, {
    message: 'major must be in list of allowed majors',
    each: true
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
  async users(@Args() args: UsersArgs): Promise<SearchUsersResult> {
    const mustShouldParams: esb.Query[] = [];
    const filterShouldParams: esb.Query[] = [];
    const filterMustParams: esb.Query[] = [];

    if (args.query) {
      mustShouldParams.push(esb.termQuery('name', args.query));
      if (isEmail(args.query)) {
        mustShouldParams.push(esb.termQuery('email', args.query));
      }
      mustShouldParams.push(esb.termQuery('username', args.query));
      mustShouldParams.push(esb.termQuery('locationName', args.query));
    }
    if (args.type) {
      filterMustParams.push(esb.termQuery('type', args.type));
    }
    if (args.majors) {
      for (const major of args.majors) {
        filterShouldParams.push(esb.termQuery('major', major));
      }
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
            .should(filterShouldParams)
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
