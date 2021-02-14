import { Resolver, Query, Ctx, ArgsType, Field, Int, Args } from 'type-graphql';
import { elasticClient } from '../elastic/init';
import { userIndexName } from '../elastic/settings';
import { RequestParams } from '@elastic/elasticsearch';
import { GraphQLContext } from '../utils/context';
import { verifyLoggedIn } from '../auth/checkAuth';
import { TermQuery } from '../elastic/types';
import { Min, Max } from 'class-validator';
import { checkPaginationArgs, setPaginationArgs } from '../elastic/pagination';
import User, { SearchUser } from '../schema/users/user.entity';
import { getRepository } from 'typeorm';

const maxPerPage = 20;

@ArgsType()
export class UsersArgs {
  @Min(0, {
    message: 'page number must be greater than or equal to 0'
  })
  @Field(_type => Int, { description: 'page number', nullable: true })
  page?: number;

  @Min(1, {
    message: 'per page must be greater than or equal to 1'
  })
  @Max(maxPerPage, {
    message: `per page must be less than or equal to ${maxPerPage}`
  })
  @Field(_type => Int, { description: 'number per page', nullable: true })
  perpage?: number;
}

@Resolver()
class UsersResolver {
  @Query(_returns => [SearchUser])
  async users(@Args() args: UsersArgs, @Ctx() ctx: GraphQLContext): Promise<SearchUser[]> {
    if (!verifyLoggedIn(ctx) || !ctx.auth) {
      throw new Error('user not logged in');
    }
    checkPaginationArgs(args);
    const UserModel = getRepository(User);
    const user = await UserModel.findOne(ctx.auth.id);
    if (!user) {
      throw new Error('cannot find user');
    }
    if (user.projects.length === 0) {
      return [];
    }
    const shouldParams: TermQuery[] = [];
    for (const project of user.projects) {
      shouldParams.push({
        term: {
          _id: project._id.toHexString()
        }
      });
    }
    const searchParams: RequestParams.Search = {
      index: userIndexName,
      body: {
        query: {
          bool: {
            should: shouldParams
          }
        }
      }
    };
    setPaginationArgs(args, searchParams);
    const elasticUserData = await elasticClient.search(searchParams);
    const results: SearchUser[] = [];
    for (const hit of elasticUserData.body.hits.hits) {
      const currentUser: SearchUser = {
        ...hit._source as SearchUser,
        id: hit._id as string,
      };
      results.push(currentUser);
    }
    return results;
  }
}

export default UsersResolver;
