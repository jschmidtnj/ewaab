import { GraphQLContext } from '../utils/context';
import argon2 from 'argon2';
import { generateJWTAccess, generateJWTMediaAccess, generateJWTRefresh, mediaJWTExpiration } from '../utils/jwt';
import { Resolver, ArgsType, Field, Args, Ctx, Mutation } from 'type-graphql';
import { MinLength } from 'class-validator';
import { passwordMinLen } from '../shared/variables';
import { UserType } from '../schema/users/user.entity';
import { setMediaCookie, setRefreshCookie } from '../utils/cookies';
import { verifyRecaptcha } from '../utils/recaptcha';
import { getRepository } from 'typeorm';
import UserCode from '../schema/users/userCode.entity';
import { connectionName } from '../db/connect';

@ArgsType()
class LoginVisitorArgs {
  @Field(_type => String, { description: 'recaptcha token' })
  recaptchaToken: string;

  @Field(_type => String, { description: 'code' })
  @MinLength(passwordMinLen, {
    message: `code must contain at least ${passwordMinLen} characters`
  })
  code: string;
}

@Resolver()
class LoginResolvers {
  @Mutation(_returns => String)
  async loginVisitor(@Args() args: LoginVisitorArgs, @Ctx() ctx: GraphQLContext): Promise<string> {
    if (!(await verifyRecaptcha(args.recaptchaToken))) {
      throw new Error('invalid recaptcha token');
    }
    const UserCodeModel = getRepository(UserCode, connectionName);
    const codeSplit = args.code.split(':');
    if (codeSplit.length !== 2) {
      throw new Error('invalid code provided');
    }
    const codeID = codeSplit[0];
    const code = codeSplit[1];
    const userData = await UserCodeModel.findOne(codeID, {
      select: ['id', 'tokenVersion', 'code']
    });
    if (!userData) {
      throw new Error(`cannot find code with id ${codeID}`);
    }
    if (!await argon2.verify(userData.code, code)) {
      throw new Error('code is invalid');
    }
    const token = await generateJWTAccess({
      emailVerified: true,
      id: codeID,
      type: UserType.visitor
    });
    setRefreshCookie(ctx.res, await generateJWTRefresh({
      id: codeID,
      tokenVersion: userData.tokenVersion,
      type: UserType.visitor
    }));
    setMediaCookie(ctx.res, await generateJWTMediaAccess({
      id: codeID,
      type: UserType.visitor
    }, mediaJWTExpiration));
    return token;
  }
}

export default LoginResolvers;
