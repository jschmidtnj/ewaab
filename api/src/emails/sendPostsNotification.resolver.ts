import { Resolver, ArgsType, Field, Args, Mutation, Ctx } from 'type-graphql';
import { IsOptional, Matches, ValidateIf } from 'class-validator';
import { configData, getAPIURL } from '../utils/config';
import { emailTemplateFiles, PostEmailData } from './compileEmailTemplates';
import { sendEmailUtil } from './sendEmail.resolver';
import { getLogger } from 'log4js';
import { uuidRegex } from '../shared/variables';
import { getRepository } from 'typeorm';
import User from '../schema/users/user.entity';
import { verifyAdmin } from '../auth/checkAuth';
import { GraphQLContext } from '../utils/context';
import { PostSortOption } from '../schema/posts/post.entity';
import { getPosts } from '../posts/posts.resolver';
import { getPublisherData } from '../posts/searchResults.resolver';
import { Converter } from 'showdown';
import { generateJWTMediaAccess } from '../utils/jwt';
import { sanitize } from '../utils/sanitizeHTML';
import { connectionName } from '../db/connect';

const logger = getLogger();

@ArgsType()
class SendPostNotificationArgs {
  @Field(_type => String, { description: 'user id', nullable: true })
  @IsOptional()
  @ValidateIf((_obj, val?: string) => val !== undefined && val.length > 0)
  @Matches(uuidRegex, {
    message: 'invalid user id provided, must be uuid v4'
  })
  id?: string;
}

const getAvatarURL = (avatar: string | null | undefined, authToken?: string): string => {
  return avatar && authToken ? `${getAPIURL()}/media/${avatar}?auth=${authToken}` : `${configData.WEBSITE_URL}/assets/img/default_avatar.png`;
};

export const sendNotification = async (id: string): Promise<string> => {
  const UserModel = getRepository(User, connectionName);
  const userData = await UserModel.findOne(id, {
    select: ['id', 'name', 'username', 'avatar', 'email', 'type']
  });
  if (!userData) {
    throw new Error(`cannot get data for user ${id}`);
  }
  const postData = await getPosts({
    ascending: false,
    page: 0,
    perpage: 10,
    sortBy: PostSortOption.created
  });

  const markdownConverter = new Converter();

  const postEmailData: PostEmailData[] = await Promise.all(postData.results.map(async (post): Promise<PostEmailData> => {
    const publisherData = await getPublisherData(post.publisher);
    const authToken = publisherData?.avatar ? await generateJWTMediaAccess({
      id: userData.id,
      type: userData.type,
      media: post.id
    }) : undefined;
    return {
      avatarURL: getAvatarURL(publisherData ? publisherData.avatar : null, authToken),
      authorURL: publisherData ? `${configData.WEBSITE_URL}/${publisherData.username}` : `${configData.WEBSITE_URL}/404`,
      name: publisherData ? publisherData.name : 'Deleted',
      username: publisherData ? publisherData.username : undefined,
      content: sanitize(markdownConverter.makeHtml(post.content)),
    };
  }));
  const emailTemplateData = emailTemplateFiles.postNotifications;
  const template = emailTemplateData.template;
  if (!template) {
    throw new Error('cannot find posts notification email template');
  }
  const authToken = userData.avatar ? await generateJWTMediaAccess({
    id: userData.id,
    type: userData.type,
    media: userData.avatar
  }) : undefined;
  const emailData = template({
    websiteURL: configData.WEBSITE_URL,
    avatarURL: getAvatarURL(userData.avatar, authToken),
    username: userData.username,
    name: userData.name,
    posts: postEmailData
  });
  await sendEmailUtil({
    content: emailData,
    email: userData.email,
    subject: emailTemplateData.subject
  });
  logger.info('email was sent!');
  return `sent notification email to ${userData.email}`;
};

@Resolver()
class SendPostsNotificationResolver {
  @Mutation(_returns => String)
  async sendPostsNotification(@Args() args: SendPostNotificationArgs, @Ctx() ctx: GraphQLContext): Promise<string> {
    if (!verifyAdmin(ctx) || !ctx.auth) {
      throw new Error('user not admin');
    }
    let id = ctx.auth.id;
    if (args.id !== undefined) {
      id = args.id;
    }
    return await sendNotification(id);
  }
}

export default SendPostsNotificationResolver;
