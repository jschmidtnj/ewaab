import { config } from 'dotenv';
import { cosmiconfig } from 'cosmiconfig';

export const appName = 'ewaab-api';

interface ConfigType {
  PORT: number;
  JWT_ISSUER: string;
  API_HOST: string;
  WEBSITE_URL: string;
  DEBUG: boolean;
  PRODUCTION: boolean;
  JWT_SECRET: string;
  DB_CONNECTION_URI: string;
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD: string;
  AWS_S3_BUCKET_FILES: string;
  AWS_S3_BUCKET_EMAILS: string;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  AWS_REGION: string;
  DISABLE_CACHE: boolean;
  ENABLE_INITIALIZATION: boolean;
  SENDGRID_API_KEY: string;
  NOREPLY_EMAIL: string,
  NOREPLY_EMAIL_NAME: string,
  RECAPTCHA_SECRET: string;
  ELASTICSEARCH_URI: string;
  INITIALIZATION_KEY: string;
}

export const configData: ConfigType = {
  PORT: 8080,
  JWT_ISSUER: 'EWAAB',
  API_HOST: 'api.ewaab.org',
  WEBSITE_URL: 'https://network.ewaab.org',
  DEBUG: false,
  PRODUCTION: true,
  JWT_SECRET: '',
  DB_CONNECTION_URI: '',
  REDIS_HOST: '',
  REDIS_PORT: 6379,
  REDIS_PASSWORD: '',
  AWS_S3_BUCKET_FILES: 'ewaab-files',
  AWS_S3_BUCKET_EMAILS: 'ewaab-emails',
  AWS_ACCESS_KEY_ID: '',
  AWS_SECRET_ACCESS_KEY: '',
  AWS_REGION: 'us-east-1',
  DISABLE_CACHE: false,
  ENABLE_INITIALIZATION: false,
  SENDGRID_API_KEY: '',
  NOREPLY_EMAIL: 'noreply@ewaab.org',
  NOREPLY_EMAIL_NAME: 'no reply',
  RECAPTCHA_SECRET: '',
  ELASTICSEARCH_URI: '',
  INITIALIZATION_KEY: ''
};

const addToConfig = (conf: any, allString: boolean): void => {
  for (const key in configData) {
    if (key in conf) {
      const currentType = typeof (configData as any)[key];
      let currentVal = conf[key];
      let givenType = typeof conf[key];
      if (allString && currentType !== givenType) {
        if (currentType === 'boolean') {
          if (currentVal === 'true') {
            currentVal = true;
            givenType = 'boolean';
          } else if (currentVal === 'false') {
            currentVal = false;
            givenType = 'boolean';
          }
        } else if (currentType === 'number') {
          currentVal = Number(currentVal);
          givenType = 'number';
        }
      }
      if (currentType !== givenType) {
        // eslint-disable-next-line no-console
        console.warn(`invalid type ${givenType} found for ${key} with type ${currentType} in config`);
      } else {
        (configData as any)[key] = currentVal;
      }
    }
  }
};

export const initializeConfig = async (): Promise<void> => {
  const configRes = await cosmiconfig(appName, {
    cache: false
  }).search();
  if (!configRes || configRes.isEmpty) {
    throw new Error('no configuration found in config');
  }
  const conf = configRes.config;
  addToConfig(conf, false);
  config();
  addToConfig(process.env, true);

  // more validation goes here
};
