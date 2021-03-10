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

const getAvatarURL = (avatar: string | null | undefined): string => {
  return avatar ? `${getAPIURL()}/media/${avatar}` : `${configData.WEBSITE_URL}/assets/img/default_avatar.png`;
}

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
    const UserModel = getRepository(User);
    const userData = await UserModel.findOne(id, {
      select: ['id', 'name', 'username', 'avatar', 'email']
    });
    if (!userData) {
      throw new Error(`cannot get data for user ${id}`);
    }
    const postData = await getPosts({
      ascending: false,
      page: 0,
      perpage: 10,
      sortBy: PostSortOption.created
    }, ctx);
    const markdownConverter = new Converter();
    const postEmailData: PostEmailData[] = await Promise.all(postData.results.map(async (post): Promise<PostEmailData> => {
      const publisherData = await getPublisherData(post.publisher);
      return {
        avatarURL: publisherData ? getAvatarURL(publisherData.avatar) : `${configData.WEBSITE_URL}/404`,
        name: publisherData ? publisherData.name : 'Deleted',
        username: publisherData ? publisherData.username : '404',
        content: markdownConverter.makeHtml(post.content),
      }
    }));
    const emailTemplateData = emailTemplateFiles.postNotifications;
    const template = emailTemplateData.template;
    if (!template) {
      throw new Error('cannot find posts notification email template');
    }
    const emailData = template({
      avatarURL: getAvatarURL(userData.avatar),
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
  }
}

export default SendPostsNotificationResolver;
