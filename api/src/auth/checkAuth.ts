import { GraphQLContext } from '../utils/context';
import { configData } from '../utils/config';
import { getRepository } from 'typeorm';
import Post, { PostType } from '../schema/posts/post.entity';
import { UserType } from '../schema/users/user.entity';
import { postViewMap, postWriteMap } from '../utils/variables';
import Message from '../schema/users/message.entity';

export const verifyGuest = (ctx: GraphQLContext): boolean => {
  return ctx.auth !== undefined;
};

export const verifyLoggedIn = (ctx: GraphQLContext, checkEmailVerified = true): boolean => {
  return verifyGuest(ctx) && ctx.auth !== undefined && ctx.auth.type !== UserType.visitor &&
    (checkEmailVerified ? ctx.auth.emailVerified : true);
};

export const verifyAdmin = (ctx: GraphQLContext, executeAdmin?: boolean): boolean => {
  if (executeAdmin) {
    if (!configData.ENABLE_INITIALIZATION) {
      throw new Error('cannot use is-admin when initialization is not enabled');
    }
    return true;
  }
  return verifyLoggedIn(ctx) && ctx.auth?.type === UserType.admin;
};

export enum AuthAccessType {
  view = 'view',
  add = 'add',
  modify = 'modify'
}

interface CheckPostAccessArgs {
  ctx: GraphQLContext;
  accessType: AuthAccessType;
  id?: string;
  postType?: PostType;
  publisher?: string;
}

export const checkPostAccess = async (args: CheckPostAccessArgs): Promise<boolean> => {
  if (!verifyLoggedIn(args.ctx) || !args.ctx.auth) {
    return false;
  }
  if (args.accessType === AuthAccessType.add) {
    if (!args.postType) {
      throw new Error('post type must be provided for add');
    }
    return postWriteMap[args.ctx.auth.type].includes(args.postType);
  } else if (!args.id) {
    throw new Error('post id must be provided');
  }
  if (args.ctx.auth.type === UserType.admin) {
    // admin can do anything
    return true;
  }
  if (!args.postType || !args.publisher) {
    const PostModel = getRepository(Post);
    const post = await PostModel.findOne(args.id, {
      select: ['type', 'publisher']
    });
    if (!post) {
      throw new Error(`cannot find post with id ${args.id}`);
    }
    args.postType = post.type;
    args.publisher = post.publisher;
  }
  if (args.accessType === AuthAccessType.view) {
    return postViewMap[args.ctx.auth.type].includes(args.postType);
  } else if (args.accessType === AuthAccessType.modify) {
    return args.publisher === args.ctx.auth.id;
  } else {
    throw new Error(`unhandled access type for post: ${args.accessType}`);
  }
};

interface CheckMessageAccessArgs {
  ctx: GraphQLContext;
  accessType: AuthAccessType;
  messageID?: string;
  publisher?: string;
  group?: string;
}

export const checkMessageAccess = async (args: CheckMessageAccessArgs): Promise<boolean> => {
  if (!verifyLoggedIn(args.ctx) || !args.ctx.auth) {
    return false;
  }
  if (args.accessType === AuthAccessType.add) {
    // anyone who is signed in can send a message to anyone else
    return true;
  } else if (!args.messageID) {
    throw new Error('message id must be provided');
  }
  if (args.ctx.auth.type === UserType.admin) {
    // admin can do anything
    return true;
  }
  if (!args.publisher || !args.group) {
    const MessageModel = getRepository(Message);
    const message = await MessageModel.findOne(args.messageID, {
      select: ['publisher', 'group']
    });
    if (!message) {
      throw new Error(`cannot find message with id ${args.messageID}`);
    }
    args.publisher = message.publisher;
    args.group = message.group;
  }
  if (args.accessType === AuthAccessType.view) {
    // publisher and group can view messages
    return [args.publisher, args.group].includes(args.ctx.auth.id);
  } else if (args.accessType === AuthAccessType.modify) {
    return args.publisher === args.ctx.auth.id;
  } else {
    throw new Error(`unhandled access type for messages: ${args.accessType}`);
  }
};
