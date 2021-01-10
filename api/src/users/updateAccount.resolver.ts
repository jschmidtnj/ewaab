import argon2 from 'argon2';
import { GraphQLContext } from '../utils/context';
import { Resolver, ArgsType, Field, Args, Ctx, Mutation } from 'type-graphql';
import { IsEmail, MinLength, Matches, IsOptional } from 'class-validator';
import { passwordMinLen, specialCharacterRegex, numberRegex, lowercaseLetterRegex, capitalLetterRegex, avatarWidth } from '../shared/variables';
import { verifyLoggedIn } from '../auth/checkAuth';
import { getRepository } from 'typeorm';
import User from '../schema/users/user.entity';
import { QueryPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { emailTemplateFiles } from '../emails/compileEmailTemplates';
import { sendEmailUtil } from '../emails/sendEmail.resolver';
import { configData } from '../utils/config';
import { generateJWTVerifyEmail } from './register.resolver';
import statusCodes from 'http-status-codes';
import { ApolloError } from 'apollo-server-express';
import { GraphQLUpload } from 'graphql-upload';
import { FileUpload } from 'graphql-upload';
import { blurredWidth, maxFileUploadSize } from '../utils/variables';
import { fileBucket, getMediaKey, s3Client } from '../utils/aws';
import Media from '../schema/media/media.entity';
import sharp from 'sharp';
import { imageMime } from '../utils/misc';

@ArgsType()
class UpdateArgs {
  @Field(_type => String, { description: 'name', nullable: true })
  @IsOptional()
  name?: string;

  @Field(_type => String, { description: 'email', nullable: true })
  @IsOptional()
  @IsEmail({}, {
    message: 'invalid email provided'
  })
  email?: string;

  @Field(_type => GraphQLUpload, { description: 'avatar', nullable: true })
  avatar?: Promise<FileUpload>;

  @Field(_type => String, { description: 'password', nullable: true })
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
  password?: string;
}

@Resolver()
class UpdateAccountResolver {
  @Mutation(_returns => String)
  async updateAccount(@Args() args: UpdateArgs, @Ctx() ctx: GraphQLContext): Promise<string> {
    if (!verifyLoggedIn(ctx) || !ctx.auth) {
      throw new Error('user not logged in');
    }
    if (!Object.values(args).some(elem => elem !== undefined)) {
      throw new ApolloError('no updates found', `${statusCodes.BAD_REQUEST}`);
    }
    const userUpdateData: QueryPartialEntity<User> = {};
    const UserModel = getRepository(User);
    if (args.name && args.name.length > 0) {
      userUpdateData.name = args.name;
    } else {
      const currentUser = await UserModel.findOne(ctx.auth.id);
      if (!currentUser) {
        throw new ApolloError('could not get current user', `${statusCodes.INTERNAL_SERVER_ERROR}`);
      }
      args.name = currentUser.name;
    }
    if (args.email) {
      userUpdateData.email = args.email;
      userUpdateData.emailVerified = false;
      const emailTemplateData = emailTemplateFiles.verifyEmail;
      const template = emailTemplateData.template;
      if (!template) {
        throw new Error('cannot find register email template');
      }
      const verify_token = await generateJWTVerifyEmail(ctx.auth.id);
      const emailData = template({
        name: args.name,
        verify_url: `${configData.WEBSITE_URL}/login?token=${verify_token}&verify_email=true`
      });
      await sendEmailUtil({
        content: emailData,
        email: args.email,
        name: args.name,
        subject: emailTemplateData.subject
      });
    }
    if (args.password) {
      userUpdateData.password = await argon2.hash(args.password);
    }
    return new Promise<string>(async (resolve, reject) => {
      const callback = async () => {
        await UserModel.update(ctx.auth!.id, userUpdateData);
        return `updated user ${ctx.auth!.id}`;
      };
      if (args.avatar) {
        const file = await args.avatar;
        if (!file.mimetype.startsWith(imageMime)) {
          reject(new Error('invalid image provided for avatar'));
          return;
        }
        const readStream = file.createReadStream();
        if (readStream.readableLength > maxFileUploadSize) {
          reject(new Error(`file ${file.filename} is larger than the max file size of ${maxFileUploadSize} bytes`));
          return;
        }
        const data: Uint8Array[] = [];
        readStream.on('data', (chunk: Uint8Array) => data.push(chunk));
        readStream.on('error', reject);
        readStream.on('end', () => {
          const buffer = Buffer.concat(data);
          const MediaModel = getRepository(Media);
          (async () => {
            const newMedia = await MediaModel.save({
              fileSize: readStream.readableLength,
              mime: file.mimetype,
              name: file.filename,
              user: ctx.auth!.id
            });
            const original = await sharp(buffer).resize(avatarWidth).toBuffer();

            // upload original
            await s3Client.upload({
              Bucket: fileBucket,
              Key: getMediaKey(newMedia.id),
              Body: original,
              ContentType: file.mimetype,
              ContentEncoding: file.encoding,
            }).promise();

            const blurred = await sharp(buffer).blur().resize(blurredWidth).toBuffer();
            // upload blurred
            await s3Client.upload({
              Bucket: fileBucket,
              Key: getMediaKey(newMedia.id, true),
              Body: blurred,
              ContentType: file.mimetype,
              ContentEncoding: file.encoding,
            }).promise();

            userUpdateData.avatar = newMedia.id;

            resolve(await callback());
          })();
        });
        readStream.read();
      } else {
        resolve(await callback());
      }
    });
  }
}

export default UpdateAccountResolver;
