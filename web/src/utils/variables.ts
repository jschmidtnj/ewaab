import { UserType, PostType } from 'lib/generated/datamodel';

export const searchHelpLink =
  'https://github.com/jschmidtnj/ewaab/blob/main/docs/search_help.md';

export interface SelectNumberObject {
  label: number;
  value: number;
}

export const defaultLoggedInPage = '/community';
export const defaultLoggedInPageVisitor = '/profiles';

export const defaultPerPage = 10;

const perPageValues = [5, defaultPerPage, 15];

export const elasticWaitTime = 1000; // time to wait for elastic to update

export const perPageOptions: SelectNumberObject[] = perPageValues.map(
  (val) => ({
    label: val,
    value: val,
  })
);

export const userTypeLabels: Record<UserType, string> = {
  [UserType.User]: 'Participant',
  [UserType.Mentor]: 'Mentor',
  [UserType.Visitor]: 'Recruiter',
  [UserType.Admin]: 'EWAAB Staff',
};

export interface SelectUserTypeObject {
  label: string;
  value: UserType;
}

export const userTypeOptions = [
  UserType.User,
  UserType.Mentor,
  UserType.Admin,
].map(
  (userType): SelectUserTypeObject => ({
    label: userTypeLabels[userType],
    value: userType,
  })
);

export interface SelectStringObject {
  label: string;
  value: string;
}

export const postTypeLabelMap: Record<PostType, string> = {
  [PostType.Community]: 'Community',
  [PostType.Bridge]: 'Bridge',
  [PostType.MentorNews]: 'Mentor News',
  [PostType.Jobs]: 'Jobs',
};

const allPostTypesOrder: PostType[] = [
  PostType.Community,
  PostType.Bridge,
  PostType.MentorNews,
  PostType.Jobs,
];

// should match api/src/utils/variables.ts
export const postViewMap: Record<UserType, PostType[]> = {
  [UserType.Admin]: allPostTypesOrder,
  [UserType.User]: [PostType.Community, PostType.Bridge, PostType.Jobs],
  [UserType.Mentor]: [PostType.Community, PostType.MentorNews, PostType.Jobs],
  [UserType.Visitor]: [PostType.Jobs],
};

export const postWriteMap: Record<UserType, PostType[]> = {
  [UserType.Admin]: allPostTypesOrder,
  [UserType.User]: [PostType.Community],
  [UserType.Mentor]: [PostType.Community, PostType.MentorNews, PostType.Jobs],
  [UserType.Visitor]: [PostType.Jobs],
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
  [PostType.Bridge]: {
    name: 'bridge',
    href: '/bridge',
  },
  [PostType.MentorNews]: {
    name: 'mentor news',
    href: '/mentor-news',
  },
  [PostType.Jobs]: {
    name: 'jobs',
    href: '/jobs',
  },
};

export const accountLink: LinkData = {
  name: 'account',
  href: '/account',
};
export const profilesLink: LinkData = {
  name: 'user profiles',
  href: '/profiles',
};
export const loginLink: LinkData = {
  name: 'login',
  href: '/login',
};
export const searchLink: LinkData = {
  name: 'search',
  href: '/search',
};
export const adminLink: LinkData = {
  name: 'admin',
  href: '/admin',
};

export const adminPaths: string[] = [adminLink].map((elem) => elem.href);

export const feedPaths: string[] = Object.values(linkMap).map(
  (elem) => elem.href
);

export const allDefinedPaths: string[] = [
  ...feedPaths,
  ...[accountLink, profilesLink, loginLink, searchLink, adminLink].map(
    (elem) => elem.href
  ),
];

export const allowedVisitorPaths: LinkData[] = [profilesLink];
export const dynamicAllowedVisitorPaths: string[] = ['/[profile]'];
