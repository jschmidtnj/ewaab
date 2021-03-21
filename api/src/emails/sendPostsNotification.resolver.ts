import { Resolver, ArgsType, Field, Args, Mutation, Ctx, Int } from 'type-graphql';
import { IsOptional, IsPositive, Matches, ValidateIf } from 'class-validator';
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
import { getMediaData, getPublisherData } from '../posts/searchResults.resolver';
import { Converter } from 'showdown';
import { generateJWTMediaAccess } from '../utils/jwt';
import { sanitize } from '../utils/sanitizeHTML';
import { format } from 'date-fns';
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

  @Field(_type => Int, { description: 'created after this date', nullable: true })
  @IsOptional()
  @ValidateIf((_obj, val?: number) => val !== undefined)
  @IsPositive({ message: 'utc timestamp must be greater than 0' })
  created?: number;
}

const getMediaURL = (id: string, authToken: string): string => {
  return `${getAPIURL()}/media/${id}?t=${authToken}`;
};

const getAvatarURL = (avatar: string | null | undefined, authToken?: string): string => {
  return avatar && authToken ? getMediaURL(avatar, authToken) : `${configData.WEBSITE_URL}/assets/img/default_avatar.png`;
};

export const sendNotification = async (id: string, created?: number): Promise<string> => {
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
    sortBy: PostSortOption.created,
    created
  });

  if (postData.count === 0) {
    throw new Error('no posts found in given timeframe');
  }

  const markdownConverter = new Converter();

  const postEmailData: PostEmailData[] = await Promise.all(postData.results.map(async (post): Promise<PostEmailData> => {
    const publisherData = await getPublisherData(post.publisher);
    const mediaData = post.media ? await getMediaData(post.media) : undefined;
    return {
      avatarURL: getAvatarURL(publisherData ? publisherData.avatar : null,
        publisherData?.avatar ? await generateJWTMediaAccess({
          id: userData.id,
          type: userData.type,
          media: publisherData.avatar
        }) : undefined),
      authorURL: publisherData ? `${configData.WEBSITE_URL}/${publisherData.username}` : `${configData.WEBSITE_URL}/404`,
      name: publisherData ? publisherData.name : 'Deleted',
      username: publisherData ? publisherData.username : undefined,
      content: sanitize(markdownConverter.makeHtml(post.content)),
      link: post.link ? post.link : undefined,
      media: mediaData ? {
        ...mediaData,
        url: getMediaURL(mediaData.id, await generateJWTMediaAccess({
          id: userData.id,
          type: userData.type,
          media: mediaData.id
        }))
      } : undefined,
      reactionCount: post.reactionCount,
      commentCount: post.commentCount
    };
  }));
  const emailTemplateData = emailTemplateFiles.postNotifications;
  const template = emailTemplateData.template;
  if (!template) {
    throw new Error('cannot find posts notification email template');
  }
  const emailData = template({
    websiteURL: configData.WEBSITE_URL,
    avatarURL: getAvatarURL(userData.avatar, userData.avatar ?
      await generateJWTMediaAccess({
        id: userData.id,
        type: userData.type,
        media: userData.avatar
      }) : undefined),
    username: userData.username,
    name: userData.name,
    posts: postEmailData
  });
  const now = new Date();
  const subject = `${emailTemplateData.subject} ${format(now, "MMM do, 'yy")}`
  await sendEmailUtil({
    content: emailData,
    email: userData.email,
    subject
  });
  await UserModel.update(id, {
    lastEmailNotification: now.getTime()
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
    return await sendNotification(id, args.created);
  }
}

export default SendPostsNotificationResolver;
