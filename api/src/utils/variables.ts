import { PostType } from '../schema/posts/post.entity';
import { UserType } from '../schema/users/user.entity';

export const maxFileUploadSize = 15 * 1e6; // bytes
export const blurredWidth = 20;
export const defaultDBCache = 200; // ms

export const notificationTopic = 'notifications';
export const messagesTopic = 'messages';

// should match web/src/utils/variables.ts
export const postViewMap: Record<UserType, PostType[]> = {
  [UserType.admin]: Object.values(PostType),
  [UserType.user]: Object.values(PostType),
  [UserType.mentor]: [PostType.community, PostType.mentorNews],
  [UserType.visitor]: [PostType.jobs],
};

export const postWriteMap: Record<UserType, PostType[]> = {
  [UserType.admin]: Object.values(PostType),
  [UserType.user]: [PostType.community],
  [UserType.mentor]: [PostType.community, PostType.mentorNews],
  [UserType.visitor]: [PostType.jobs],
};
