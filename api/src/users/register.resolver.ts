import argon2 from 'argon2';
import { Resolver, ArgsType, Field, Args, Mutation } from 'type-graphql';
import { IsEmail, MinLength, Matches } from 'class-validator';
import { passwordMinLen, specialCharacterRegex, numberRegex, lowercaseLetterRegex, capitalLetterRegex, validUsername, strMinLen } from '../shared/variables';
import { accountExistsEmail, accountExistsUsername } from './shared';
import User, { SearchUser } from '../schema/users/user.entity';
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
import { v4 as uuidv4 } from 'uuid';
import { InviteUserTokenData } from '../emails/inviteUser.resolver';
import { defaultMajor } from '../shared/majors';
import { defaultUniversity } from '../shared/universities';
import { elasticClient } from '../elastic/init';
import { userIndexName } from '../elastic/settings';
import { getTime } from '../shared/time';

@ArgsType()
class RegisterArgs {
  @Field(_type => String, { description: 'registration token' })
  registrationToken: string;

  @Field(_type => String, { description: 'recaptcha token' })
  recaptchaToken: string;

  @Field(_type => String, { description: 'name' })
  @MinLength(strMinLen, {
    message: `name must contain at least ${strMinLen} characters`
  })
  name: string;

  @Field(_type => String, { description: 'pronouns' })
  pronouns: string;

  @Field(_type => String, { description: 'username' })
  @Matches(validUsername, {
    message: 'invalid username provided'
  })
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
  id: string;
  type: VerifyType.verify;
}

export const generateJWTVerifyEmail = (userID: string): Promise<string> => {
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

export const decodeInvite = (token: string): Promise<InviteUserTokenData> => {
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
        resolve(res as InviteUserTokenData);
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
    const now = getTime();
    const searchUser: SearchUser = {
      created: now,
      updated: now,
      email: args.email,
      name: args.name,
      type: inviteData.userType,
      username: args.username,
      locationName: '',
      major: defaultMajor,
      description: '',
      university: defaultUniversity,
      alumniYear: inviteData.alumniYear
    };

    const id = uuidv4();

    await elasticClient.index({
      id,
      index: userIndexName,
      body: searchUser
    });
    const newUser = await UserModel.save({
      ...searchUser,
      id,
      activeMessages: [],
      pronouns: args.pronouns,
      password: hashedPassword,
      tokenVersion: 0,
      emailVerified: false,
      jobTitle: '',
      url: '',
      facebook: '',
      github: '',
      twitter: '',
      bio: '',
      mentor: ''
    });

    const emailTemplateData = emailTemplateFiles.verifyEmail;
    const template = emailTemplateData.template;
    if (!template) {
      throw new Error('cannot find register email template');
    }
    const verify_token = await generateJWTVerifyEmail(id);
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
    return `created user ${id}`;
  }
}

export default RegisterResolver;
