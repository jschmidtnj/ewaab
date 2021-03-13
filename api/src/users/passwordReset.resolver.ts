import argon2 from 'argon2';
import { Resolver, ArgsType, Field, Args, Mutation } from 'type-graphql';
import { MinLength, Matches, IsOptional } from 'class-validator';
import { passwordMinLen, specialCharacterRegex, numberRegex, lowercaseLetterRegex, capitalLetterRegex } from '../shared/variables';
import { getRepository } from 'typeorm';
import User from '../schema/users/user.entity';
import statusCodes from 'http-status-codes';
import { ApolloError } from 'apollo-server-express';
import { verifyRecaptcha } from '../utils/recaptcha';
import { getSecret, VerifyType } from '../utils/jwt';
import { PasswordResetTokenData } from '../emails/sendPasswordReset.resolver';
import { VerifyOptions, verify } from 'jsonwebtoken';
import { loginType } from '../auth/shared';
import { connectionName } from '../db/connect';

@ArgsType()
class PasswordResetArgs {
  @Field(_type => String, { description: 'recaptcha token' })
  recaptchaToken: string;

  @Field(_type => String, { description: 'reset token' })
  resetToken: string;

  @Field(_type => String, { description: 'password' })
  @IsOptional()
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

export const decodePasswordReset = (token: string): Promise<PasswordResetTokenData> => {
  return new Promise((resolve, reject) => {
    try {
      const secret = getSecret(loginType.LOCAL);
      const jwtConfig: VerifyOptions = {
        algorithms: ['HS256']
      };
      verify(token, secret, jwtConfig, (err, res: any) => {
        if (err) {
          throw err as Error;
        }
        if (!('type' in res)) {
          throw new Error('no type provided');
        }
        const type: VerifyType = res.type;
        if (type !== VerifyType.resetPassword) {
          throw new Error(`invalid verify type ${type} provided`);
        }
        resolve(res as PasswordResetTokenData);
      });
    } catch (err) {
      const errObj = err as Error;
      reject(new ApolloError(errObj.message, `${statusCodes.FORBIDDEN}`));
    }
  });
};

@Resolver()
class PasswordResetResolver {
  @Mutation(_returns => String)
  async passwordReset(@Args() args: PasswordResetArgs): Promise<string> {
    if (!(await verifyRecaptcha(args.recaptchaToken))) {
      throw new Error('invalid recaptcha token');
    }
    const passwordResetData = await decodePasswordReset(args.resetToken);
    const UserModel = getRepository(User, connectionName);
    const hashedPassword = await argon2.hash(args.password);
    await UserModel.update({
      email: passwordResetData.email
    }, {
      password: hashedPassword
    });
    return `updated user with email ${passwordResetData.email}`;
  }
}

export default PasswordResetResolver;
