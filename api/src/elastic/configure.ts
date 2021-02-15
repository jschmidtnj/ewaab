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

const logger = getLogger();

const initializeMapping = async (indexName: string, indexSettings: Record<string, unknown>, indexMappings: Record<string, unknown>, indexType: string): Promise<void> => {
  const deleteRes = await elasticClient.indices.delete({
    index: indexName,
    ignore_unavailable: true
  });
  logger.info(`deleted ${indexName} from elasticsearch: ${deleteRes.body.acknowledged as boolean}`);
  try {
    const createIndexRes = await elasticClient.indices.create({
      index: indexName,
      body: {
        settings: indexSettings
      }
    });
    logger.info(`created ${indexName} index: ${createIndexRes.statusCode === statusCodes.OK}`);
  } catch (err) {
    logger.error(err.meta.body.error);
    throw err;
  }
  const mappingsConfig: IndicesPutMapping = {
    index: indexName,
    type: indexType,
    body: {
      properties: indexMappings
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
};

export const initializeMappings = async (): Promise<string> => {
  await initializeMapping(settings.userIndexName, settings.userIndexSettings, userMappings, settings.userType);
  const UserModel = getRepository(User);
  for (const userData of await UserModel.find()) {
    const searchUser: SearchUser = {
      ...userData
    };
    await elasticClient.index({
      id: userData.id,
      index: settings.userIndexName,
      body: searchUser
    });
    await sleep(100);
  }
  await initializeMapping(settings.postIndexName, settings.postIndexSettings, postMappings, settings.postType);
  const PostModel = getRepository(Post);
  for (const postData of await PostModel.find()) {
    const searchPost: SearchPost = {
      ...postData
    };
    await elasticClient.index({
      id: postData.id,
      index: settings.postIndexName,
      body: searchPost
    });
    await sleep(100);
  }
  return 'initialized all mappings';
};
