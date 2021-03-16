import { getS3EmailData, getEmailKey } from '../utils/aws';
import Handlebars from 'handlebars';
import { MediaType } from '../schema/media/media.entity';
import helpers from 'handlebars-helpers';

interface PostMediaData {
  id: string;
  name: string;
  type: MediaType;
  url: string;
}

export interface PostEmailData {
  name: string;
  username?: string;
  avatarURL: string;
  authorURL: string;
  content: string;
  link?: string;
  media?: PostMediaData;
  reactionCount: number;
  commentCount: number;
}

interface TemplateFiles {
  hello: {
    file: string;
    template?: HandlebarsTemplateDelegate<{
      name: string;
    }>;
    subject: string;
  }
  verifyEmail: {
    file: string;
    template?: HandlebarsTemplateDelegate<{
      verify_url: string;
      name: string;
    }>;
    subject: string;
  },
  inviteUser: {
    file: string;
    template?: HandlebarsTemplateDelegate<{
      verify_url: string;
      name: string;
    }>;
    subject: string;
  }
  passwordReset: {
    file: string;
    template?: HandlebarsTemplateDelegate<{
      verify_url: string;
    }>;
    subject: string;
  },
  postNotifications: {
    file: string;
    template?: HandlebarsTemplateDelegate<{
      websiteURL: string;
      avatarURL: string;
      username: string;
      name: string;
      posts: PostEmailData[];
    }>;
    subject: string;
  }
}

const propertyOf = <TObj>(name: string): keyof TObj => name as keyof TObj;

export const emailTemplateFiles: TemplateFiles = {
  hello: {
    file: 'hello.html',
    template: undefined,
    subject: 'Hello World!'
  },
  verifyEmail: {
    file: 'verify_email.html',
    template: undefined,
    subject: 'Verify Email'
  },
  inviteUser: {
    file: 'invite_user.html',
    template: undefined,
    subject: 'Register'
  },
  passwordReset: {
    file: 'password_reset.html',
    template: undefined,
    subject: 'Password Reset'
  },
  postNotifications: {
    file: 'post_notifications.html',
    template: undefined,
    subject: 'EWAAB Posts'
  }
};

const compileEmailTemplates = async (): Promise<void> => {
  const { eq } = helpers('comparison');
  Handlebars.registerHelper('eq', eq);
  for (const emailTemplateKey in emailTemplateFiles) {
    const currentTemplateElement = emailTemplateFiles[propertyOf<TemplateFiles>(emailTemplateKey)];
    const emailTemplate = await getS3EmailData(getEmailKey(currentTemplateElement.file), false);
    currentTemplateElement.template = Handlebars.compile(emailTemplate) as HandlebarsTemplateDelegate;
  }
};

export default compileEmailTemplates;
