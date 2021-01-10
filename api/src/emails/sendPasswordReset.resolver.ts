import { Resolver, ArgsType, Field, Args, Mutation } from 'type-graphql';
import { IsEmail } from 'class-validator';
import { configData } from '../utils/config';
import { emailTemplateFiles } from './compileEmailTemplates';
import { getSecret, VerifyType, getJWTIssuer, verifyJWTExpiration } from '../utils/jwt';
import { sign, SignOptions } from 'jsonwebtoken';
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

export const generateJWTPasswordReset = (email: string): Promise<string> => {
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
    const authData: PasswordResetTokenData = {
      email,
      type: VerifyType.resetPassword
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
      name: 'user',
      subject: emailTemplateData.subject
    });
    logger.info('email was sent!');
    return `check email ${args.email} for password reset`;
  }
}

export default SendPasswordResetResolver;
