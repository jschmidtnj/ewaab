import { GraphQLContext } from '../utils/context';
import argon2 from 'argon2';
import { generateJWTAccess, generateJWTMediaAccess, generateJWTRefresh, mediaJWTExpiration } from '../utils/jwt';
import { Resolver, ArgsType, Field, Args, Ctx, Mutation, ObjectType } from 'type-graphql';
import { MinLength, Matches } from 'class-validator';
import { passwordMinLen, specialCharacterRegex, numberRegex, capitalLetterRegex, lowercaseLetterRegex } from '../shared/variables';
import User, { UserType } from '../schema/users/user.entity';
import { setMediaCookie, setRefreshCookie } from '../utils/cookies';
import { verifyRecaptcha } from '../utils/recaptcha';
import { FindOneOptions, getRepository } from 'typeorm';
import { connectionName } from '../db/connect';

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

@ObjectType({ description: 'login output' })
class LoginOutput {
  @Field(_type => String, { description: 'token' })
  token: string;

  @Field(_type => UserType, { description: 'user type' })
  type: UserType;
}

@Resolver()
class LoginResolvers {
  @Mutation(_returns => LoginOutput)
  async login(@Args() args: LoginArgs, @Ctx() ctx: GraphQLContext): Promise<LoginOutput> {
    if (!(await verifyRecaptcha(args.recaptchaToken))) {
      throw new Error('invalid recaptcha token');
    }
    const UserModel = getRepository(User, connectionName);
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
    setRefreshCookie(ctx.res, await generateJWTRefresh(user));
    setMediaCookie(ctx.res, await generateJWTMediaAccess(user, mediaJWTExpiration));
    return {
      token,
      type: user.type
    };
  }
}

export default LoginResolvers;
