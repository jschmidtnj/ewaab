import statusCodes from 'http-status-codes';
import { getLogger } from 'log4js';
import { elasticClient } from './init';
import * as settings from './settings';
import userMappings from './mappings/user';
import { IndicesPutMapping } from '@elastic/elasticsearch/api/requestParams';
import postMappings from './mappings/post';
import { getRepository } from 'typeorm';
import User, { SearchUser } from '../schema/users/user.entity';
import Post, { SearchPost } from '../schema/posts/post.entity';
import sleep from '../shared/sleep';
import commentMappings from './mappings/comment';
import Comment, { SearchComment } from '../schema/posts/comment.entity';
import Message, { SearchMessage } from '../schema/users/message.entity';
import messageMappings from './mappings/message';
import { bulkWriteToElastic } from './elastic';
import { WriteType } from './writeType';
import { removeKeys } from '../utils/misc';

const logger = getLogger();

const initializeMapping = async (indexName: string, indexSettings: Record<string, unknown>, indexMappings: Record<string, unknown>, indexType: string): Promise<void> => {
  const deleteRes = await elasticClient.indices.delete({
    index: indexName,
    ignore_unavailable: true
  });
  logger.info(`deleted ${indexName} from elasticsearch: ${deleteRes.body.acknowledged as boolean}`);
  await sleep(10 * 1e3);
  try {
    const createIndexRes = await elasticClient.indices.create({
      index: indexName,
      body: {
        settings: indexSettings,
      }
    });
    logger.info(`created ${indexName} index: ${createIndexRes.statusCode === statusCodes.OK}`);
  } catch (err) {
    logger.error(err.meta.body.error);
    throw err;
  }
  await sleep(1 * 1e3);
  const mappingsConfig: IndicesPutMapping = {
    index: indexName,
    type: indexType,
    body: {
      properties: indexMappings,
      dynamic: false
    },
    include_type_name: true
  };
  try {
    const setIndexMappingsRes = await elasticClient.indices.putMapping(mappingsConfig);
    logger.info(`set ${indexType} mappings: ${setIndexMappingsRes.statusCode === statusCodes.OK}`);
  } catch (err) {
    logger.error(err.meta.body.error);
    throw err;
  }
  await sleep(1 * 1e3);
};

export const initializeMappings = async (): Promise<string> => {
  // users
  await initializeMapping(settings.userIndexName, settings.userIndexSettings, userMappings, settings.userType);
  const UserModel = getRepository(User);
  const users: SearchUser[] = (await UserModel.find()).map(userData => ({
    ...userData
  }));
  if (users.length > 0) {
    await bulkWriteToElastic(users.map(userData => ({
      action: WriteType.add,
      id: userData.id as string,
      index: settings.userIndexName,
      data: removeKeys(userData, ['id'])
    })));
  }

  // posts
  await initializeMapping(settings.postIndexName, settings.postIndexSettings, postMappings, settings.postType);
  const PostModel = getRepository(Post);
  const posts: SearchPost[] = (await PostModel.find()).map(postData => ({
    ...postData
  }));
  if (posts.length > 0) {
    await bulkWriteToElastic(posts.map(postData => ({
      action: WriteType.add,
      id: postData.id as string,
      index: settings.postIndexName,
      data: removeKeys(postData, ['id'])
    })));
  }

  // comments
  await initializeMapping(settings.commentIndexName, settings.commentIndexSettings, commentMappings, settings.commentType);
  const CommentModel = getRepository(Comment);
  const comments: SearchComment[] = (await CommentModel.find()).map(commentData => ({
    ...commentData
  }));
  if (comments.length > 0) {
    await bulkWriteToElastic(comments.map(commentData => ({
      action: WriteType.add,
      id: commentData.id as string,
      index: settings.commentIndexName,
      data: removeKeys(commentData, ['id'])
    })));
  }

  // messages
  await initializeMapping(settings.messageIndexName, settings.messageIndexSettings, messageMappings, settings.messageType);
  const MessageModel = getRepository(Message);
  const messages: SearchMessage[] = (await MessageModel.find()).map(messageData => ({
    ...messageData
  }));
  if (messages.length > 0) {
    await bulkWriteToElastic(messages.map(messageData => ({
      action: WriteType.add,
      id: messageData.id as string,
      index: settings.messageIndexName,
      data: removeKeys(messageData, ['id'])
    })));
  }

  return 'initialized all mappings';
};
