import User, { UserType } from '../schema/users/user.entity';
import { Ctx, Mutation, Resolver, ArgsType, Field, Args } from 'type-graphql';
import { GraphQLContext } from '../utils/context';
import { verifyAdmin, verifyVisitor } from './checkAuth';
import { IsEmail, IsOptional } from 'class-validator';
import { clearCookies } from '../utils/cookies';
import { FindOneOptions, getRepository } from 'typeorm';
import UserCode from '../schema/users/userCode.entity';
import { connectionName } from '../db/connect';

@ArgsType()
class RevokeArgs {
  @Field(_type => String, { description: 'email', nullable: true })
  @IsOptional()
  @IsEmail({}, {
    message: 'invalid email provided'
  })
  email: string;
}

@Resolver()
export class UserResolver {
  @Mutation(_returns => String)
  logout(@Ctx() { res }: GraphQLContext): string {
    clearCookies(res);
    return 'logged out';
  }

  @Mutation(_returns => String)
  async revokeRefresh(@Args() { email }: RevokeArgs, @Ctx() ctx: GraphQLContext): Promise<string> {
    const isAdmin = email !== undefined;
    if (isAdmin) {
      if (!verifyAdmin(ctx)) {
        throw new Error('user not admin');
      }
    } else {
      if (!verifyVisitor(ctx, false)) {
        throw new Error('user not logged in');
      }
    }
    if (!ctx.auth) {
      throw new Error('cannot find auth data');
    }

    if (ctx.auth.type === UserType.visitor) {
      const UserCodeModel = getRepository(UserCode, connectionName);
      const userCodeData = await UserCodeModel.findOne(ctx.auth.id, {
        select: ['id']
      });
      if (!userCodeData) {
        throw new Error(`cannot find user code with id ${ctx.auth.id}`);
      }
      await UserCodeModel.increment({
        id: userCodeData.id
      }, 'tokenVersion', 1);
      return `revoked token for ${userCodeData.id}`;
    }

    const UserModel = getRepository(User, connectionName);
    let user: User | undefined;
    const findOptions: FindOneOptions<User> = {
      select: ['id']
    };
    if (!isAdmin) {
      user = await UserModel.findOne(ctx.auth.id, findOptions);
    } else {
      user = await UserModel.findOne({
        email
      }, findOptions);
    }
    if (!user) {
      throw new Error('no user found');
    }
    if (!user.id) {
      throw new Error('no user id found');
    }
    await UserModel.increment({
      id: user.id
    }, 'tokenVersion', 1);
    return `revoked token for ${user.id}`;
  }
}