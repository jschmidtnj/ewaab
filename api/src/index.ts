import { initializeDB } from './db/connect';
import { initializeServer } from './server';
import { initializeLogger } from './utils/logger';
import { configData, initializeConfig } from './utils/config';
import { initializeAWS } from './utils/aws';
import { initializeRedis } from './utils/redis';
import { initializeSendgrid } from './emails/sendgrid';
import compileEmailTemplates from './emails/compileEmailTemplates';

const runAPI = async (): Promise<void> => {
  // initialize config and logger
  await initializeConfig();
  const logger = initializeLogger();
  logger.info('logger initialized');

  try {
    logger.info('start aws initialize');
    await initializeAWS();
    logger.info('aws initialized');
    logger.info('start db initialize');
    await initializeDB(configData.DB_CONNECTION_URI);
    logger.info('database connection set up');
    logger.info('start redis initialize');
    await initializeRedis();
    logger.info('connected to redis');
    logger.info('start sendgrid initialize');
    await initializeSendgrid();
    logger.info('sendgrid connection initialized');
    logger.info('start email templates initialize');
    await compileEmailTemplates();
    logger.info('email templates compiled');
    logger.info('start server initialize');
    await initializeServer();
    logger.info('server started');
  } catch (err) {
    logger.fatal(err.message);
    process.exit(1);
  }
};

if (require.main === module) {
  runAPI();
}

export default runAPI;
