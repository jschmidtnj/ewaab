import { EventBridgeHandler } from 'aws-lambda';
import { getLogger } from 'log4js';
import { getRepository } from 'typeorm';
import { initializeDB, connectionName } from './shared/db/connect';
import { initializeElastic } from './shared/elastic/init';
import compileEmailTemplates from './shared/emails/compileEmailTemplates';
import { sendNotification } from './shared/emails/sendPostsNotification.resolver';
import User from './shared/schema/users/user.entity';
import { initializeAWS } from './shared/utils/aws';
import { configData, initializeConfig } from './shared/utils/config';
import { initializeLogger } from './shared/utils/logger';

const logger = getLogger();

const appName = 'ewaab-email-notifications';

const initialize = async (): Promise<void> => {
  logger.info('start aws initialize');
  await initializeAWS();
  logger.info('aws initialized');
  logger.info('start elastic initialize');
  await initializeElastic();
  logger.info('connected to elasticsearch');
  logger.info('start db initialize');
  await initializeDB(configData.DB_CONNECTION_URI);
  logger.info('database connection set up');
  logger.info('start email templates initialize');
  await compileEmailTemplates();
  logger.info('email templates compiled');
};

const sendAllNotifications = async (): Promise<void> => {
  await initialize();
  const UserModel = getRepository(User, connectionName);
  for (const userData of await UserModel.find({
    select: ['id'],
    where: {
      emailNotifications: true
    }
  })) {
    await sendNotification(userData.id);
  }
};

export const handler: EventBridgeHandler<string, null, string> = async (_event, _context, _callback): Promise<string> => {
  await initializeConfig(appName);
  initializeLogger();
  await sendAllNotifications();
  return 'finished sending all email notifications';
};

const sendPostsNotifications = async (): Promise<void> => {
  await initializeConfig(appName);
  initializeLogger();
  await sendAllNotifications();
};

if (require.main === module) {
  sendPostsNotifications().then(() => {
    logger.info('done with sending notifications');
    process.exit(0);
  }).catch((err: Error) => {
    console.error(err.message);
    process.exit(1);
  });
}

export default sendPostsNotifications;
