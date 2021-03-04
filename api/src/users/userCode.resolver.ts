import argon2 from 'argon2';
import { Resolver, ArgsType, Field, Args, Mutation, Ctx, Query } from 'type-graphql';
import { Matches, MinLength } from 'class-validator';
import { getRepository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { verifyAdmin } from '../auth/checkAuth';
import { GraphQLContext } from '../utils/context';
import UserCode from '../schema/users/userCode.entity';
import { strMinLen, uuidRegex } from '../shared/variables';
import { generate } from 'generate-password';

@ArgsType()
class NewUserCodeArgs {
  @Field(_type => String, { description: 'name' })
  @MinLength(strMinLen, {
    message: `name must contain at least ${strMinLen} characters`
  })
  name: string;
}

@ArgsType()
class DeleteUserCodeArgs {
  @Field(_type => String, { description: 'user code id' })
  @Matches(uuidRegex, {
    message: 'invalid user code id provided, must be uuid v4'
  })
  id: string;
}

@Resolver()
class UserCodeResolver {
  @Mutation(_returns => String)
  async addUserCode(@Args() args: NewUserCodeArgs, @Ctx() ctx: GraphQLContext): Promise<string> {
    if (!verifyAdmin(ctx) || !ctx.auth) {
      throw new Error('user must be admin');
    }
    const UserCodeModel = getRepository(UserCode);
    const id = uuidv4();
    const password = generate({
      length: 30,
      numbers: true
    });
    const code = await argon2.hash(`${id}:${password}`);
    const now = new Date().getTime();
    await UserCodeModel.save({
      id,
      code,
      created: now,
      name: args.name,
      tokenVersion: 0
    });
    return code;
  }

  @Query(_returns => [UserCode])
  async userCodes(@Ctx() ctx: GraphQLContext): Promise<UserCode[]> {
    if (!verifyAdmin(ctx) || !ctx.auth) {
      throw new Error('user must be admin');
    }
    const UserCodeModel = getRepository(UserCode);
    const userCodes = await UserCodeModel.find();
    return userCodes;
  }

  @Mutation(_returns => String)
  async deleteUserCode(@Args() args: DeleteUserCodeArgs, @Ctx() ctx: GraphQLContext): Promise<string> {
    if (!verifyAdmin(ctx) || !ctx.auth) {
      throw new Error('user must be admin');
    }
    const UserCodeModel = getRepository(UserCode);
    if (await UserCodeModel.count({
      id: args.id
    }) === 0) {
      throw new Error(`cannot find user code with id ${args.id}`);
    }
    await UserCodeModel.delete(args.id);
    return `deleted user code with id ${args.id}`;
  }
}

export default UserCodeResolver;
