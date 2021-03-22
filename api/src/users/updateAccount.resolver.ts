import argon2 from 'argon2';
import { GraphQLContext } from '../utils/context';
import { Resolver, ArgsType, Field, Args, Ctx, Mutation, Int } from 'type-graphql';
import { IsEmail, MinLength, Matches, IsOptional, IsUrl, ValidateIf, IsIn, Min, Max } from 'class-validator';
import { passwordMinLen, specialCharacterRegex, numberRegex, lowercaseLetterRegex, capitalLetterRegex, avatarWidth, validUsername, locationRegex, strMinLen, ewaabFounded, uuidRegex } from '../shared/variables';
import { verifyAdmin, verifyLoggedIn } from '../auth/checkAuth';
import { getRepository } from 'typeorm';
import User, { BaseSearchUser, UserType } from '../schema/users/user.entity';
import { QueryPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { emailTemplateFiles } from '../emails/compileEmailTemplates';
import { sendEmailUtil } from '../emails/sendEmail.resolver';
import { configData } from '../utils/config';
import { generateJWTVerifyEmail } from './register.resolver';
import { v4 as uuidv4 } from 'uuid';
import statusCodes from 'http-status-codes';
import { ApolloError } from 'apollo-server-express';
import { GraphQLUpload } from 'graphql-upload';
import { FileUpload } from 'graphql-upload';
import { blurredWidth, maxFileUploadSize } from '../utils/variables';
import { fileBucket, getMediaKey, s3Client } from '../utils/aws';
import Media, { MediaParentType, MediaType } from '../schema/media/media.entity';
import sharp from 'sharp';
import { checkTextFile } from '../utils/misc';
import { deleteMedia } from './media.resolver';
import { elasticClient } from '../elastic/init';
import { userIndexName } from '../elastic/settings';
import majors from '../shared/majors';
import universities from '../shared/universities';
import { connectionName } from '../db/connect';
import { supportedImageMimes } from '../shared/variables';

@ArgsType()
class UpdateArgs {
  @Field(_type => String, { description: 'user id', nullable: true })
  @IsOptional()
  @ValidateIf((_obj, val?: string) => val !== undefined && val.length > 0)
  @Matches(uuidRegex, {
    message: 'invalid user id provided, must be uuid v4'
  })
  id?: string;

  @Field(_type => UserType, { description: 'user type', nullable: true })
  @IsOptional()
  type?: UserType;

  @Field(_type => String, { description: 'name', nullable: true })
  @IsOptional()
  @MinLength(strMinLen, {
    message: `name must contain at least ${strMinLen} characters`
  })
  name?: string;

  @Field(_type => String, { description: 'email', nullable: true })
  @IsOptional()
  @IsEmail({}, {
    message: 'invalid email provided'
  })
  email?: string;

  @Field(_type => GraphQLUpload, { description: 'avatar', nullable: true })
  @IsOptional()
  avatar?: Promise<FileUpload>;

  @Field(_type => GraphQLUpload, { description: 'resume', nullable: true })
  @IsOptional()
  resume?: Promise<FileUpload>;

  @Field(_type => String, { description: 'job title', nullable: true })
  @IsOptional()
  jobTitle?: string;

  @Field(_type => String, { description: 'pronouns', nullable: true })
  @IsOptional()
  pronouns?: string;

  @Field(_type => String, { description: 'location', nullable: true })
  @IsOptional()
  @ValidateIf((_obj, val?: string) => val !== undefined && val.length > 0)
  @Matches(locationRegex, {
    message: 'invalid relative location provided'
  })
  location?: string;

  @Field(_type => String, { description: 'location name', nullable: true })
  @IsOptional()
  locationName?: string;

  @Field(_type => String, { description: 'major', nullable: true })
  @IsOptional()
  @ValidateIf((_obj, val?: string) => val !== undefined && val.length > 0)
  @IsIn(majors, {
    message: 'invalid major provided'
  })
  major?: string;

  @Field(_type => String, { description: 'url', nullable: true })
  @IsOptional()
  @ValidateIf((_obj, val?: string) => val !== undefined && val.length > 0)
  @IsUrl({}, {
    message: 'invalid url provided'
  })
  url?: string;

  @Field(_type => String, { description: 'facebook', nullable: true })
  @IsOptional()
  @ValidateIf((_obj, val?: string) => val !== undefined && val.length > 0)
  @Matches(validUsername, {
    message: 'invalid facebook username'
  })
  facebook?: string;

  @Field(_type => String, { description: 'github', nullable: true })
  @IsOptional()
  @ValidateIf((_obj, val?: string) => val !== undefined && val.length > 0)
  @Matches(validUsername, {
    message: 'invalid github handle'
  })
  github?: string;

  @Field(_type => String, { description: 'twitter', nullable: true })
  @IsOptional()
  @ValidateIf((_obj, val?: string) => val !== undefined && val.length > 0)
  @Matches(validUsername, {
    message: 'invalid twitter handle'
  })
  twitter?: string;

  @Field(_type => Boolean, { description: 'email notifications', nullable: true })
  @IsOptional()
  emailNotifications?: boolean;

  @Field(_type => String, { description: 'description', nullable: true })
  @IsOptional()
  description?: string;

  @Field(_type => String, { description: 'short bio', nullable: true })
  @IsOptional()
  bio?: string;

  @Field(_type => String, { description: 'university', nullable: true })
  @IsOptional()
  @ValidateIf((_obj, val?: string) => val !== undefined && val.length > 0)
  @IsIn(universities, {
    message: 'invalid university provided'
  })
  university?: string;

  @Field(_type => Int, { description: 'alumni year', nullable: true })
  @IsOptional()
  @Min(ewaabFounded, {
    message: 'invalid alumni year provided'
  })
  @Max(new Date().getFullYear() + 3, {
    message: 'year cannot be that far in the future'
  })
  alumniYear?: number;

  @Field(_type => String, { description: 'mentor', nullable: true })
  @IsOptional()
  mentor?: string;

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

    const isAdmin = verifyAdmin(ctx);
    if (args.id !== undefined && args.id !== ctx.auth.id && !isAdmin) {
      throw new Error('user must be admin to change other user');
    }
    if (args.alumniYear !== undefined && !isAdmin) {
      throw new Error('user must be admin to modify alumni year');
    }
    if (args.type !== undefined && !isAdmin) {
      throw new Error('only admins can change user type');
    }

    let id: string;
    if (args.id !== undefined) {
      id = args.id;
    } else {
      id = ctx.auth.id;
    }
    if (!Object.values(args).some(elem => elem !== undefined)) {
      throw new ApolloError('no updates found', `${statusCodes.BAD_REQUEST}`);
    }
    const userUpdateData: QueryPartialEntity<User> = {};
    const userElasticUpdateData: QueryPartialEntity<BaseSearchUser> = {};
    const UserModel = getRepository(User, connectionName);

    const currentUser = await UserModel.findOne(id, {
      select: ['name', 'avatar']
    });
    if (!currentUser) {
      throw new ApolloError('could not get current user', `${statusCodes.INTERNAL_SERVER_ERROR}`);
    }

    if (args.name && args.name.length > 0) {
      userUpdateData.name = args.name;
      userElasticUpdateData.name = args.name;
    } else {
      args.name = currentUser.name;
    }

    if (args.email) {
      userUpdateData.email = args.email;
      userElasticUpdateData.email = args.email;
      userUpdateData.emailVerified = false;
      const emailTemplateData = emailTemplateFiles.verifyEmail;
      const template = emailTemplateData.template;
      if (!template) {
        throw new Error('cannot find register email template');
      }
      const verify_token = await generateJWTVerifyEmail(id);
      const emailData = template({
        name: args.name,
        verify_url: `${configData.WEBSITE_URL}/login?t=${verify_token}&verify_email=true`
      });
      await sendEmailUtil({
        content: emailData,
        email: args.email,
        subject: emailTemplateData.subject
      });
    }
    if (args.password) {
      userUpdateData.password = await argon2.hash(args.password);
    }

    if (+(args.location === undefined) ^ +(args.locationName === undefined)) {
      throw new Error('location and name must both be defined');
    }
    if (args.location !== undefined) {
      userUpdateData.location = args.location;
      userElasticUpdateData.location = args.location;
      userUpdateData.locationName = args.locationName;
      userElasticUpdateData.locationName = args.locationName;
    }

    const now = new Date().getTime();
    userUpdateData.updated = now;
    userElasticUpdateData.updated = now;

    // other fields
    if (args.major !== undefined) {
      userUpdateData.major = args.major;
      userElasticUpdateData.major = args.major;
    }
    if (args.pronouns !== undefined) {
      userUpdateData.pronouns = args.pronouns;
    }
    if (args.jobTitle !== undefined) {
      userUpdateData.jobTitle = args.jobTitle;
    }
    if (args.url !== undefined) {
      userUpdateData.url = args.url;
    }
    if (args.facebook !== undefined) {
      userUpdateData.facebook = args.facebook;
    }
    if (args.github !== undefined) {
      userUpdateData.github = args.github;
    }
    if (args.twitter !== undefined) {
      userUpdateData.twitter = args.twitter;
    }
    if (args.emailNotifications !== undefined) {
      userUpdateData.emailNotifications = args.emailNotifications;
    }
    if (args.description !== undefined) {
      userUpdateData.description = args.description;
      userElasticUpdateData.description = args.description;
    }
    if (args.bio !== undefined) {
      userUpdateData.bio = args.bio;
    }
    if (args.university !== undefined) {
      userUpdateData.university = args.university;
      userElasticUpdateData.university = args.university;
    }
    if (args.alumniYear !== undefined) {
      userUpdateData.alumniYear = args.alumniYear;
      userElasticUpdateData.alumniYear = args.alumniYear;
    }
    if (args.type !== undefined) {
      userUpdateData.type = args.type;
      userElasticUpdateData.type = args.type;
    }
    if (args.mentor !== undefined) {
      userUpdateData.mentor = args.mentor;
    }

    return new Promise<string>(async (resolve, reject) => {
      try {
        const callback = async () => {
          await UserModel.update(id, userUpdateData);
          await elasticClient.update({
            id,
            index: userIndexName,
            body: {
              doc: userElasticUpdateData
            }
          });
          // delete at the end, after new avatar is created
          if (args.avatar && currentUser.avatar) {
            await deleteMedia(currentUser.avatar);
          }
          return `updated user ${id}`;
        };
  
        let numReading = 0;
  
        if (args.resume) {
          numReading++;
          const resumeFile = await args.resume;
          if (!checkTextFile(resumeFile.mimetype)) {
            throw new Error('invalid text file provided for resume');
          }
          const resumeReadStream = resumeFile.createReadStream();
          if (resumeReadStream.readableLength > maxFileUploadSize) {
            throw new Error(`resume file ${resumeFile.filename} is larger than the max file size of ${maxFileUploadSize} bytes`);
          }
          const data: Uint8Array[] = [];
          resumeReadStream.on('data', (chunk: Uint8Array) => data.push(chunk));
          resumeReadStream.on('error', reject);
          resumeReadStream.on('end', () => {
            const buffer = Buffer.concat(data);
            const MediaModel = getRepository(Media, connectionName);
            (async () => {
              if (currentUser.resume) {
                await deleteMedia(currentUser.resume);
              }
              const newMedia = await MediaModel.save({
                id: uuidv4(),
                fileSize: resumeReadStream.readableLength,
                mime: resumeFile.mimetype,
                name: resumeFile.filename,
                parent: id,
                parentType: MediaParentType.user,
                type: MediaType.file,
              });
  
              // upload original
              await s3Client.upload({
                Bucket: fileBucket,
                Key: getMediaKey(newMedia.id),
                Body: buffer,
                ContentType: resumeFile.mimetype,
                ContentEncoding: resumeFile.encoding,
              }).promise();
  
              userUpdateData.resume = newMedia.id;
  
              numReading--;
              if (numReading === 0) {
                resolve(await callback());
              }
            })();
          });
          resumeReadStream.read();
        }
  
        if (args.avatar) {
          numReading++;
          const avatarFile = await args.avatar;
          if (!supportedImageMimes.includes(avatarFile.mimetype)) {
            throw new Error('invalid image provided for avatar');
          }
          const avatarReadStream = avatarFile.createReadStream();
          if (avatarReadStream.readableLength > maxFileUploadSize) {
            throw new Error(`avatar file ${avatarFile.filename} is larger than the max file size of ${maxFileUploadSize} bytes`);
          }
          const data: Uint8Array[] = [];
          avatarReadStream.on('data', (chunk: Uint8Array) => data.push(chunk));
          avatarReadStream.on('error', reject);
          avatarReadStream.on('end', () => {
            const buffer = Buffer.concat(data);
            const MediaModel = getRepository(Media, connectionName);
            (async () => {
              const newMedia = await MediaModel.save({
                id: uuidv4(),
                fileSize: avatarReadStream.readableLength,
                mime: avatarFile.mimetype,
                name: avatarFile.filename,
                parent: id,
                parentType: MediaParentType.user,
                type: MediaType.image,
              });
              const original = await sharp(buffer).resize(avatarWidth).toBuffer();
  
              // upload original
              await s3Client.upload({
                Bucket: fileBucket,
                Key: getMediaKey(newMedia.id),
                Body: original,
                ContentType: avatarFile.mimetype,
                ContentEncoding: avatarFile.encoding,
              }).promise();
  
              const blurred = await sharp(buffer).blur().resize(blurredWidth).toBuffer();
              // upload blurred
              await s3Client.upload({
                Bucket: fileBucket,
                Key: getMediaKey(newMedia.id, true),
                Body: blurred,
                ContentType: avatarFile.mimetype,
                ContentEncoding: avatarFile.encoding,
              }).promise();
  
              userUpdateData.avatar = newMedia.id;
              userElasticUpdateData.avatar = newMedia.id;
  
              numReading--;
              if (numReading === 0) {
                resolve(await callback());
              }
            })();
          });
          avatarReadStream.read();
        }
  
        if (numReading === 0) {
          resolve(await callback());
        }
      } catch (err) {
        reject(err as Error);
      }
    });
  }
}

export default UpdateAccountResolver;
