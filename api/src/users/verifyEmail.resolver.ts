import { Resolver, ArgsType, Field, Args, Mutation } from 'type-graphql';
import { MinLength } from 'class-validator';
import { minJWTLen } from '../shared/variables';
import { VerifyTokenData } from './register.resolver';
import { getSecret, VerifyType } from '../utils/jwt';
import { VerifyOptions, verify } from 'jsonwebtoken';
import { ApolloError } from 'apollo-server-express';
import statusCodes from 'http-status-codes';
import { loginType } from '../auth/shared';
import { getRepository } from 'typeorm';
import User from '../schema/users/user.entity';

@ArgsType()
class VerifyEmailArgs {
  @Field(_type => String, { description: 'name' })
  @MinLength(minJWTLen, {
    message: `jwt must contain at least ${minJWTLen} characters`
  })
  token: string;
}

export const decodeVerify = (token: string): Promise<VerifyTokenData> => {
  return new Promise((resolve, reject) => {
    let secret: string;
    try {
      secret = getSecret(loginType.LOCAL);
    } catch (err) {
      const errObj = err as Error;
      reject(new ApolloError(errObj.message, `${statusCodes.FORBIDDEN}`));
      return;
    }
    const jwtConfig: VerifyOptions = {
      algorithms: ['HS256']
    };
    verify(token, secret, jwtConfig, (err, res: any) => {
      try {
        if (err) {
          const errObj = err as Error;
          throw new ApolloError(errObj.message, `${statusCodes.FORBIDDEN}`);
        }
        if (!('type' in res)) {
          throw new ApolloError('no type provided', `${statusCodes.BAD_REQUEST}`);
        }
        const type: VerifyType = res.type;
        if (type !== VerifyType.verify) {
          throw new ApolloError(`invalid verify type ${type} provided`, `${statusCodes.BAD_REQUEST}`);
        }
        resolve(res as VerifyTokenData);
      } catch (err) {
        reject(err);
      }
    });
  });
};

@Resolver()
class VerifyEmailResolver {
  @Mutation(_returns => String)
  async verifyEmail(@Args() args: VerifyEmailArgs): Promise<string> {
    const verificationData = await decodeVerify(args.token);
    const UserModel = getRepository(User);
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
