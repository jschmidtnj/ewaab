import { Resolver, Ctx, Query, ArgsType, Field, Args } from 'type-graphql';
import { GraphQLContext } from '../utils/context';
import User, { PublicUser } from '../schema/users/user.entity';
import { verifyLoggedIn } from '../auth/checkAuth';
import { ApolloError } from 'apollo-server-express';
import statusCodes from 'http-status-codes';
import { getRepository } from 'typeorm';

@ArgsType()
class PublicUserArgs {
  @Field({ description: 'user id', nullable: true })
  id?: number;

  @Field({ description: 'user name', nullable: true })
  username?: string;
}

@Resolver()
class PublicUserResolver {
  @Query(_type => PublicUser, { description: 'public user data' })
  async publicUser(@Args() args: PublicUserArgs, @Ctx() ctx: GraphQLContext): Promise<PublicUser> {
    let user: User | undefined;
    const UserModel = getRepository(User);
    if (args.id) {
      user = await UserModel.findOne(args.id);
    } else if (args.username) {
      user = await UserModel.findOne({
        username: args.username
      });
    } else if (verifyLoggedIn(ctx) && ctx.auth) {
      user = await UserModel.findOne(ctx.auth.id);
    } else {
      throw new ApolloError('no username or id provided, and not logged in', `${statusCodes.NOT_FOUND}`);
    }
    if (!user) {
      throw new ApolloError('cannot find user', `${statusCodes.NOT_FOUND}`);
    }
    return user as PublicUser;
  }
}

export default PublicUserResolver;
