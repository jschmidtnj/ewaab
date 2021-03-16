import { Resolver, ArgsType, Field, Args, Mutation } from 'type-graphql';
import { IsEmail } from 'class-validator';
import { configData } from '../utils/config';
import { emailTemplateFiles } from './compileEmailTemplates';
import { getSecret, VerifyType, getJWTIssuer, verifyJWTExpiration, signPromise } from '../utils/jwt';
import type { SignOptions } from 'jsonwebtoken';
import { sendEmailUtil } from './sendEmail.resolver';
import { loginType } from '../auth/shared';
import { accountExistsEmail } from '../users/shared';
import { verifyRecaptcha } from '../utils/recaptcha';
import { getLogger } from 'log4js';

const logger = getLogger();

@ArgsType()
class SendPasswordResetArgs {
  @Field(_type => String, { description: 'recaptcha token' })
  recaptchaToken: string;

  @Field(_type => String, { description: 'email' })
  @IsEmail({}, {
    message: 'invalid email provided'
  })
  email: string;
}

export interface PasswordResetTokenData {
  email: string;
  type: VerifyType.resetPassword;
}

export const generateJWTPasswordReset = async (email: string): Promise<string> => {
  const secret = getSecret(loginType.LOCAL);
  const jwtIssuer = getJWTIssuer();
  const authData: PasswordResetTokenData = {
    email,
    type: VerifyType.resetPassword
  };
  const signOptions: SignOptions = {
    issuer: jwtIssuer,
    expiresIn: verifyJWTExpiration
  };
  const token = await signPromise(authData, secret, signOptions);
  return token;
};

@Resolver()
class SendPasswordResetResolver {
  @Mutation(_returns => String)
  async sendPasswordReset(@Args() args: SendPasswordResetArgs): Promise<string> {
    if (!(await verifyRecaptcha(args.recaptchaToken))) {
      throw new Error('invalid recaptcha token');
    }
    if (!(await accountExistsEmail(args.email))) {
      throw new Error(`email ${args.email} not registered`);
    }
    const emailTemplateData = emailTemplateFiles.passwordReset;
    const template = emailTemplateData.template;
    if (!template) {
      throw new Error('cannot find register email template');
    }
    const passwordResetToken = await generateJWTPasswordReset(args.email);
    const emailData = template({
      verify_url: `${configData.WEBSITE_URL}/reset?token=${passwordResetToken}`,
    });
    await sendEmailUtil({
      content: emailData,
      email: args.email,
      subject: emailTemplateData.subject
    });
    logger.info('email was sent!');
    return `check email ${args.email} for password reset`;
  }
}

export default SendPasswordResetResolver;
