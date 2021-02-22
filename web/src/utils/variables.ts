import { UserType, PostType } from 'lib/generated/datamodel';

export interface SelectNumberObject {
  label: number;
  value: number;
}

export const defaultLoggedInPage = '/community';

export const defaultPerPage = 10;

const perPageValues = [5, defaultPerPage, 15];

export const perPageOptions: SelectNumberObject[] = perPageValues.map(
  (val) => ({
    label: val,
    value: val,
  })
);

export interface SelectStringObject {
  label: string;
  value: string;
}

export const postTypeLabelMap: Record<PostType, string> = {
  [PostType.Community]: 'Community',
  [PostType.EncourageHer]: 'Encourage Her',
  [PostType.MentorNews]: 'Mentor News',
  [PostType.EhParticipantNews]: 'EH Participant News',
};

export const postViewMap: Record<UserType, PostType[]> = {
  [UserType.Admin]: Object.values(PostType),
  [UserType.User]: Object.values(PostType),
  [UserType.Mentor]: [PostType.MentorNews, PostType.Community],
  [UserType.Visitor]: [],
};

export const postWriteMap: Record<UserType, PostType[]> = {
  [UserType.Admin]: Object.values(PostType),
  [UserType.User]: [PostType.Community],
  [UserType.Mentor]: [PostType.MentorNews],
  [UserType.Visitor]: [],
};
