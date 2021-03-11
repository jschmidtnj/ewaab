import { ExpressContext } from 'apollo-server-express/dist/ApolloServer';
import { decodeAuth, AuthData } from './jwt';
import { Request, Response } from 'express';
import { loginType } from '../auth/shared';
import { getRepository } from 'typeorm';
import MessageGroup from '../schema/users/messageGroup.entity';
import { defaultDBCache } from './variables';
import { connectionName } from '../db/connect';

export interface BaseSubscriptionContext {
  auth?: AuthData;
  groups: string[];
}

export interface GraphQLContext {
  auth?: AuthData;
  req: Request;
  res: Response;
}

export type SubscriptionContext = BaseSubscriptionContext & GraphQLContext;

const extractBearerToken = (data: string): string => {
  if (!(data.split(' ')[0] === 'Bearer')) {
    return '';
  }
  return data.split(' ')[1];
};

export const getToken = (req: Request): string => {
  if (!(req.headers.authorization)) {
    return '';
  }
  return extractBearerToken(req.headers.authorization);
};

export const onSubscription = async (params: Record<string, unknown>): Promise<BaseSubscriptionContext> => {
  if (!('Authorization' in params)) {
    // require at least guest login
    throw new Error('auth token must be provided');
  }
  const token = extractBearerToken(params['Authorization'] as string);
  const auth = await decodeAuth(loginType.LOCAL, token);

  const MessageGroupModel = getRepository(MessageGroup, connectionName);
  const groupData = await MessageGroupModel.createQueryBuilder('messageGroup')
    .where('messageGroup.userIDs @> :userIDs').setParameters({
      userIDs: [auth.id]
    }).select(['id']).cache(defaultDBCache).getMany();
  const groups = groupData.map(groupObj => groupObj.id);

  return {
    auth,
    groups
  };
};

export const getContext = async ({ req, res, connection }: ExpressContext): Promise<GraphQLContext | SubscriptionContext> => {
  if (connection) {
    return {
      ...(connection.context as BaseSubscriptionContext),
      req,
      res
    };
  }
  const token = getToken(req);
  if (token.length === 0) {
    // don't require any authorization
    return {
      req,
      res
    };
  }
  const authData = await decodeAuth(loginType.LOCAL, token);
  return {
    auth: authData,
    req,
    res
  };
};
