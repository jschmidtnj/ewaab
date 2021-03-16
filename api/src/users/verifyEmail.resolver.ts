import { Resolver, ArgsType, Field, Args, Mutation } from 'type-graphql';
import { MinLength } from 'class-validator';
import { minJWTLen } from '../shared/variables';
import { VerifyTokenData } from './register.resolver';
import { getSecret, verifyPromise, VerifyType } from '../utils/jwt';
import type { VerifyOptions } from 'jsonwebtoken';
import { ApolloError } from 'apollo-server-express';
import statusCodes from 'http-status-codes';
import { loginType } from '../auth/shared';
import { getRepository } from 'typeorm';
import User from '../schema/users/user.entity';
import { connectionName } from '../db/connect';

@ArgsType()
class VerifyEmailArgs {
  @Field(_type => String, { description: 'name' })
  @MinLength(minJWTLen, {
    message: `jwt must contain at least ${minJWTLen} characters`
  })
  token: string;
}

export const decodeVerify = async (token: string): Promise<VerifyTokenData> => {
  const secret = getSecret(loginType.LOCAL);

  const jwtConfig: VerifyOptions = {
    algorithms: ['HS256']
  };
  const jwtData = await verifyPromise(token, secret, jwtConfig) as Record<string, any>;
  if (!('type' in jwtData)) {
    throw new ApolloError('no type provided', `${statusCodes.BAD_REQUEST}`);
  }
  const type: VerifyType = jwtData.type;
  if (type !== VerifyType.verify) {
    throw new ApolloError(`invalid verify type ${type} provided`, `${statusCodes.BAD_REQUEST}`);
  }
  return jwtData as VerifyTokenData;
};

@Resolver()
class VerifyEmailResolver {
  @Mutation(_returns => String)
  async verifyEmail(@Args() args: VerifyEmailArgs): Promise<string> {
    const verificationData = await decodeVerify(args.token);
    const UserModel = getRepository(User, connectionName);
    const user = await UserModel.findOne(verificationData.id, {
      select: ['id', 'email', 'emailVerified']
    });
    if (!user) {
      throw new ApolloError('cannot find user with given id', `${statusCodes.NOT_FOUND}`);
    }
    if (user.emailVerified) {
      throw new ApolloError('email already verified');
    }
    await UserModel.update(user.id, {
      emailVerified: true
    });
    return (`verified email ${user.email}`);
  }
}

export default VerifyEmailResolver;
