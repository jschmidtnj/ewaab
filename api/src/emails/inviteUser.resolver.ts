import { Resolver, ArgsType, Field, Args, Mutation, Ctx, Int } from 'type-graphql';
import { IsEmail, Max, Min } from 'class-validator';
import { configData } from '../utils/config';
import { emailTemplateFiles } from './compileEmailTemplates';
import { getSecret, VerifyType, getJWTIssuer, verifyJWTExpiration } from '../utils/jwt';
import { sign, SignOptions } from 'jsonwebtoken';
import { verifyAdmin } from '../auth/checkAuth';
import { GraphQLContext } from '../utils/context';
import { sendEmailUtil } from './sendEmail.resolver';
import { loginType } from '../auth/shared';
import { accountExistsEmail } from '../users/shared';
import { UserType } from '../schema/users/user.entity';
import { ewaabFounded } from '../shared/variables';

@ArgsType()
class InviteUserArgs {
  @Field(_type => String, { description: 'name' })
  name: string;

  @Field(_type => String, { description: 'email' })
  @IsEmail({}, {
    message: 'invalid email provided'
  })
  email: string;

  @Field(_type => UserType, { description: 'user type', nullable: true, defaultValue: UserType.user })
  type: UserType;

  @Field(_type => Int, { description: 'alumni year' })
  @Min(ewaabFounded, {
    message: 'invalid alumni year provided'
  })
  @Max(new Date().getFullYear() + 3, {
    message: 'year cannot be that far in the future'
  })
  alumniYear: number;

  @Field({ description: 'execute as pseudo-admin when not in production', nullable: true })
  executeAdmin?: boolean;
}

export interface InviteUserTokenData {
  email: string;
  name: string;
  type: VerifyType.invite;
  userType: UserType;
  alumniYear: number;
}

export const generateJWTInviteUser = (email: string, name: string,
  type: UserType, alumniYear: number): Promise<string> => {
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
    const authData: InviteUserTokenData = {
      email,
      name,
      type: VerifyType.invite,
      userType: type,
      alumniYear
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

@Resolver()
class InviteUserResolver {
  @Mutation(_returns => String)
  async inviteUser(@Args() args: InviteUserArgs, @Ctx() ctx: GraphQLContext): Promise<string> {
    if (!verifyAdmin(ctx, args.executeAdmin)) {
      throw new Error('user must be an admin to invite new users');
    }
    if (await accountExistsEmail(args.email)) {
      throw new Error('user with email already registered');
    }
    const emailTemplateData = emailTemplateFiles.inviteUser;
    const template = emailTemplateData.template;
    if (!template) {
      throw new Error('cannot find register email template');
    }
    const invite_token = await generateJWTInviteUser(args.email, args.name, args.type, args.alumniYear);
    const emailData = template({
      name: args.name,
      verify_url: `${configData.WEBSITE_URL}/register?token=${invite_token}&email=${encodeURIComponent(args.email)}&name=${encodeURIComponent(args.name)}`,
    });
    await sendEmailUtil({
      content: emailData,
      email: args.email,
      subject: emailTemplateData.subject
    });
    return `check email ${args.email} for confirmation`;
  }
}

export default InviteUserResolver;
