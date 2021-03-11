import { Resolver, Ctx, Query, ArgsType, Field, Args } from 'type-graphql';
import { GraphQLContext } from '../utils/context';
import User, { PublicUser } from '../schema/users/user.entity';
import { verifyVisitor } from '../auth/checkAuth';
import { ApolloError } from 'apollo-server-express';
import statusCodes from 'http-status-codes';
import { getRepository } from 'typeorm';
import { keys } from 'ts-transformer-keys';
import { connectionName } from '../db/connect';

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
    if (!verifyVisitor(ctx) || !ctx.auth) {
      throw new Error('user must be logged in to view public user data');
    }
    let user: PublicUser | undefined;
    const UserModel = getRepository(User, connectionName);
    if (args.id) {
      user = await UserModel.findOne(args.id, {
        select: keys<PublicUser>()
      });
    } else if (args.username) {
      user = await UserModel.findOne({
        username: args.username,
      }, {
        select: keys<PublicUser>()
      });
    } else {
      user = await UserModel.findOne(ctx.auth.id, {
        select: keys<PublicUser>()
      });
    }
    if (!user) {
      throw new ApolloError('cannot find user', `${statusCodes.NOT_FOUND}`);
    }
    return user;
  }
}

export default PublicUserResolver;
