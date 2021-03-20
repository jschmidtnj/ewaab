import { UserType, PostType } from 'lib/generated/datamodel';

export interface SelectNumberObject {
  label: number;
  value: number;
}

export const defaultLoggedInPage = '/community';
export const defaultLoggedInPageVisitor = '/users';

export const defaultPerPage = 10;

const perPageValues = [5, defaultPerPage, 15];

export const elasticWaitTime = 1000; // time to wait for elastic to update

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

export interface LinkData {
  name: string;
  href: string;
}

export const linkMap: Record<PostType, LinkData> = {
  [PostType.Community]: {
    name: 'community',
    href: '/community',
  },
  [PostType.EhParticipantNews]: {
    name: 'participant news',
    href: '/participant-news',
  },
  [PostType.EncourageHer]: {
    name: 'encourage her',
    href: '/encourage-her',
  },
  [PostType.MentorNews]: {
    name: 'mentor news',
    href: '/mentor-news',
  },
};

export const accountLink: LinkData = {
  name: 'account',
  href: '/account',
};
export const usersLink: LinkData = {
  name: 'students',
  href: '/users',
};
export const loginLink: LinkData = {
  name: 'login',
  href: '/login',
};
export const searchLink: LinkData = {
  name: 'search',
  href: '/search',
};

export const feedPaths: string[] = Object.values(linkMap).map(
  (elem) => elem.href
);

export const allDefinedPaths: string[] = [
  ...feedPaths,
  ...[accountLink, usersLink, loginLink, searchLink].map((elem) => elem.href),
];

export const allowedVisitorPaths: LinkData[] = [usersLink];
export const dynamicAllowedVisitorPaths: string[] = ['/[user]'];
