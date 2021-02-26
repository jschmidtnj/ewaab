import { getLogger } from 'log4js';
import { configData } from './config';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import Redis from 'ioredis';
import BullQueue, { Queue } from 'bull';
import exitHook from 'exit-hook';

const logger = getLogger();

export let pubSub: RedisPubSub;

export let cache: Redis.Redis;

export let deleteNotificationQueue: Queue<string>;

export interface RedisKey {
  path: string;
  type: string;
}

export const initializeRedis = async (): Promise<void> => {
  if (configData.REDIS_HOST.length === 0) {
    const message = 'no redis host provided';
    throw new Error(message);
  }
  if (configData.REDIS_PORT === 0) {
    const message = 'no redis port provided';
    throw new Error(message);
  }
  const hasRedisPassword = configData.REDIS_PASSWORD.length > 0;
  if (!hasRedisPassword) {
    logger.info('no redis password provided');
  } else {
    logger.info('redis password provided');
  }
  const redisOptions: Redis.RedisOptions = {
    host: configData.REDIS_HOST,
    port: configData.REDIS_PORT,
    db: 0,
    password: hasRedisPassword ? configData.REDIS_PASSWORD : undefined
  };
  if (!hasRedisPassword) {
    redisOptions.tls = {
      ...redisOptions.tls,
      checkServerIdentity: (): undefined => undefined
    };
  }
  const publisher = new Redis(redisOptions);
  const subscriber = new Redis(redisOptions);
  cache = new Redis(redisOptions);
  pubSub = new RedisPubSub({
    publisher,
    subscriber
  });
  deleteNotificationQueue = new BullQueue('delete notifications', {
    redis: redisOptions
  });
  const closeRedis = (): void => {
    logger.info('close pub-sub');
    pubSub.close();
    deleteNotificationQueue.close();
  };
  publisher.on('error', (err: Error) => {
    closeRedis();
    logger.error(err.message);
    process.exit(1);
  });
  await publisher.ping();
  exitHook(closeRedis);
};
