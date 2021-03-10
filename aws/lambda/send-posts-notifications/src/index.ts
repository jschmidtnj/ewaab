import { EventBridgeHandler } from 'aws-lambda';
import { getLogger } from 'log4js';
import { initializeConfig } from './utils/config';

const logger = getLogger();

const sendAllNotifications = async (): Promise<void> => {
  logger.info('start db initialize');
  await initializeDB();
  logger.info('database connection set up');
};

export const handler: EventBridgeHandler<string, null, void> = async (_event, _context, callback): Promise<void> => {
  await initializeConfig(false);
  initializeLogger();
  await sendAllNotifications();
  callback();
  process.exit(0);
};

const sendPostsNotifications = async (): Promise<void> => {
  await initializeConfig(true);
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
