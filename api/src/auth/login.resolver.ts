import { GraphQLContext } from '../utils/context';
import argon2 from 'argon2';
import { generateJWTAccess, generateJWTMediaAccess, generateJWTRefresh } from '../utils/jwt';
import { Resolver, ArgsType, Field, Args, Ctx, Mutation } from 'type-graphql';
import { MinLength, Matches } from 'class-validator';
import { passwordMinLen, specialCharacterRegex, numberRegex, capitalLetterRegex, lowercaseLetterRegex } from '../shared/variables';
import User from '../schema/users/user.entity';
import { setCookies } from '../utils/cookies';
import { verifyRecaptcha } from '../utils/recaptcha';
import { FindOneOptions, getRepository } from 'typeorm';

@ArgsType()
class LoginArgs {
  @Field(_type => String, { description: 'recaptcha token' })
  recaptchaToken: string;

  @Field(_type => String, { description: 'username or email' })
  usernameEmail: string;

  @Field(_type => String, { description: 'password' })
  @MinLength(passwordMinLen, {
    message: `password must contain at least ${passwordMinLen} characters`
  })
  @Matches(lowercaseLetterRegex, {
    message: 'no lowercase letter found'
  })
  @Matches(capitalLetterRegex, {
    message: 'no capital letter found'
  })
  @Matches(numberRegex, {
    message: 'no number found'
  })
  @Matches(specialCharacterRegex, {
    message: 'no special characters found'
  })
  password: string;
}

@Resolver()
class LoginResolvers {
  @Mutation(_returns => String)
  async login(@Args() args: LoginArgs, @Ctx() ctx: GraphQLContext): Promise<string> {
    if (!(await verifyRecaptcha(args.recaptchaToken))) {
      throw new Error('invalid recaptcha token');
    }
    const UserModel = getRepository(User);
    let user: User;
    const findOptions: FindOneOptions<User> = {
      select: ['id', 'type', 'emailVerified', 'password', 'tokenVersion']
    };
    if (args.usernameEmail.includes('@')) {
      const userRes = await UserModel.findOne({
        email: args.usernameEmail
      }, findOptions);
      if (!userRes) {
        throw new Error(`cannot find user with email ${args.usernameEmail}`);
      }
      user = userRes as User;
    } else {
      const userRes = await UserModel.findOne({
        username: args.usernameEmail
      }, findOptions);
      if (!userRes) {
        throw new Error(`cannot find user with username ${args.usernameEmail}`);
      }
      user = userRes as User;
    }
    if (!user.emailVerified) {
      throw new Error('email is not verified');
    }
    if (!await argon2.verify(user.password, args.password)) {
      throw new Error('password is invalid');
    }
    const token = await generateJWTAccess(user);
    setCookies(ctx.res, await generateJWTRefresh(user), await generateJWTMediaAccess(user));
    return token;
  }
}

export default LoginResolvers;
