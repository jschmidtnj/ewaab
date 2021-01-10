import argon2 from 'argon2';
import { Resolver, ArgsType, Field, Args, Mutation } from 'type-graphql';
import { IsEmail, MinLength, Matches } from 'class-validator';
import { passwordMinLen, specialCharacterRegex, numberRegex, lowercaseLetterRegex, capitalLetterRegex, uninitializedKey } from '../shared/variables';
import { accountExistsEmail, accountExistsUsername } from './shared';
import User, { UserType } from '../schema/users/user.entity';
import { verifyRecaptcha } from '../utils/recaptcha';
import { emailTemplateFiles } from '../emails/compileEmailTemplates';
import { sendEmailUtil } from '../emails/sendEmail.resolver';
import { configData } from '../utils/config';
import { VerifyType, getSecret, getJWTIssuer, verifyJWTExpiration } from '../utils/jwt';
import { SignOptions, sign, verify, VerifyOptions } from 'jsonwebtoken';
import { loginType } from '../auth/shared';
import { getRepository } from 'typeorm';
import { ApolloError } from 'apollo-server-express';
import statusCodes from 'http-status-codes';
import { InviteNewsletterTokenData } from '../emails/inviteUser.resolver';

@ArgsType()
class RegisterArgs {
  @Field(_type => String, { description: 'registration token' })
  registrationToken: string;

  @Field(_type => String, { description: 'recaptcha token' })
  recaptchaToken: string;

  @Field(_type => String, { description: 'name' })
  name: string;

  @Field(_type => String, { description: 'username' })
  username: string;

  @Field(_type => String, { description: 'email' })
  @IsEmail({}, {
    message: 'invalid email provided'
  })
  email: string;

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

export interface VerifyTokenData {
  id: number;
  type: VerifyType.verify;
}

export const generateJWTVerifyEmail = (userID: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    let secret: string;
    let jwtIssuer: string;
    try {
      secret = getSecret(loginType.LOCAL);
      jwtIssuer = getJWTIssuer();
    } catch (err) {
      reject(err as Error);
      return;
    }
    const authData: VerifyTokenData = {
      id: userID,
      type: VerifyType.verify
    };
    const signOptions: SignOptions = {
      issuer: jwtIssuer,
      expiresIn: verifyJWTExpiration
    };
    sign(authData, secret, signOptions, (err, token) => {
      if (err) {
        reject(err as Error);
      } else {
        resolve(token as string);
      }
    });
  });
};

export const decodeInvite = (token: string): Promise<InviteNewsletterTokenData> => {
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
        if (type !== VerifyType.invite) {
          throw new ApolloError(`invalid verify type ${type} provided`, `${statusCodes.BAD_REQUEST}`);
        }
        resolve(res as InviteNewsletterTokenData);
      } catch (err) {
        reject(err);
      }
    });
  });
};

@Resolver()
class RegisterResolver {
  @Mutation(_returns => String)
  async register(@Args() args: RegisterArgs): Promise<string> {
    if (!(await verifyRecaptcha(args.recaptchaToken))) {
      throw new Error('invalid recaptcha token');
    }
    const inviteData = await decodeInvite(args.registrationToken);
    if (inviteData.email !== args.email) {
      throw new Error('provided email does not match token');
    }
    if (await accountExistsEmail(args.email)) {
      throw new Error('user with email already registered');
    }
    if (await accountExistsUsername(args.username)) {
      throw new Error('user with username already exists');
    }
    const hashedPassword = await argon2.hash(args.password);
    const UserModel = getRepository(User);
    const newUser = await UserModel.save({
      email: args.email,
      name: args.name,
      password: hashedPassword,
      tokenVersion: 0,
      emailVerified: false,
      type: UserType.user,
      avatar: uninitializedKey,
      username: args.username,
    });
    const emailTemplateData = emailTemplateFiles.verifyEmail;
    const template = emailTemplateData.template;
    if (!template) {
      throw new Error('cannot find register email template');
    }
    const verify_token = await generateJWTVerifyEmail(newUser.id);
    const emailData = template({
      name: newUser.name,
      verify_url: `${configData.WEBSITE_URL}/login?token=${verify_token}&verify_email=true`
    });
    await sendEmailUtil({
      content: emailData,
      email: newUser.email,
      name: newUser.name,
      subject: emailTemplateData.subject
    });
    return `created user ${newUser.id}`;
  }
}

export default RegisterResolver;
