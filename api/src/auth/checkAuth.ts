import { GraphQLContext } from '../utils/context';
import { PostType, UserType } from '../shared/variables';
import { configData } from '../utils/config';
import { getRepository } from 'typeorm';
import Post from '../schema/posts/post.entity';

export const verifyGuest = (ctx: GraphQLContext): boolean => {
  return ctx.auth !== undefined;
};

export const verifyLoggedIn = (ctx: GraphQLContext, checkEmailVerified?: boolean): boolean => {
  if (checkEmailVerified === undefined) {
    checkEmailVerified = true;
  }
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

export const checkPostAccess = async (ctx: GraphQLContext, id: string, postType?: PostType): Promise<boolean> => {
  if (!verifyLoggedIn(ctx)) {
    return false;
  }
  if (!postType) {
    const postModel = getRepository(Post);
    const post = await postModel.findOne(id, {
      select: ['type']
    });
    if (!post) {
      throw new Error(`cannot find post with id ${id}`);
    }
    postType = post.type;
  }
  const thirdPartyPostTypes = [PostType.mentorNews];
  if (thirdPartyPostTypes.includes(postType)) {
    return ctx.auth?.type === UserType.thirdParty;
  }
  return true;
};
