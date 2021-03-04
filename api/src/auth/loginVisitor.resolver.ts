import { GraphQLContext } from '../utils/context';
import argon2 from 'argon2';
import { generateJWTAccess, generateJWTMediaAccess, generateJWTRefresh } from '../utils/jwt';
import { Resolver, ArgsType, Field, Args, Ctx, Mutation } from 'type-graphql';
import { MinLength } from 'class-validator';
import { passwordMinLen } from '../shared/variables';
import { UserType } from '../schema/users/user.entity';
import { setCookies } from '../utils/cookies';
import { verifyRecaptcha } from '../utils/recaptcha';
import { getRepository } from 'typeorm';
import UserCode from '../schema/users/userCode.entity';

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
    const UserCodeModel = getRepository(UserCode);
    const codeID = args.code;
    const code = args.code;
    const userData = await UserCodeModel.findOne(codeID, {
      select: ['id', 'tokenVersion']
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
    setCookies(ctx.res, await generateJWTRefresh({
      id: codeID,
      tokenVersion: userData.tokenVersion
    }), await generateJWTMediaAccess({
      id: codeID,
      type: UserType.visitor
    }));
    return token;
  }
}

export default LoginResolvers;
