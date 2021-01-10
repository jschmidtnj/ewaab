import { getS3EmailData, getEmailKey } from '../utils/aws';
import Handlebars from 'handlebars';

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
};

const compileEmailTemplates = async (): Promise<void> => {
  for (const emailTemplateKey in emailTemplateFiles) {
    const currentTemplateElement = emailTemplateFiles[propertyOf<TemplateFiles>(emailTemplateKey)];
    const emailTemplate = await getS3EmailData(getEmailKey(currentTemplateElement.file), false);
    currentTemplateElement.template = Handlebars.compile(emailTemplate);
  }
};

export default compileEmailTemplates;
