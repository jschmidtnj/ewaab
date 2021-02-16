import gql from 'graphql-tag';
export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  /** The `Upload` scalar type represents a file upload. */
  Upload: any;
};

/** media object */
export type Media = {
  __typename?: 'Media';
  /** file size */
  fileSize: Scalars['Float'];
  id: Scalars['String'];
  /** mime type of file */
  mime: Scalars['String'];
  /** file name */
  name: Scalars['String'];
  /** parent */
  parent: Scalars['String'];
};

export type Mutation = {
  __typename?: 'Mutation';
  addPost: Scalars['String'];
  deleteAccount: Scalars['String'];
  deletePost: Scalars['String'];
  inviteUser: Scalars['String'];
  login: Scalars['String'];
  logout: Scalars['String'];
  passwordReset: Scalars['String'];
  register: Scalars['String'];
  revokeRefresh: Scalars['String'];
  sendPasswordReset: Scalars['String'];
  sendTestEmail: Scalars['String'];
  updateAccount: Scalars['String'];
  updatePost: Scalars['String'];
  usernameExists: Scalars['Boolean'];
  verifyEmail: Scalars['String'];
};


export type MutationAddPostArgs = {
  content: Scalars['String'];
  link: Scalars['String'];
  title: Scalars['String'];
  type: PostType;
};


export type MutationDeleteAccountArgs = {
  email?: Maybe<Scalars['String']>;
};


export type MutationDeletePostArgs = {
  id: Scalars['String'];
};


export type MutationInviteUserArgs = {
  email: Scalars['String'];
  executeAdmin?: Maybe<Scalars['Boolean']>;
  name: Scalars['String'];
  type?: Maybe<UserType>;
};


export type MutationLoginArgs = {
  password: Scalars['String'];
  recaptchaToken: Scalars['String'];
  usernameEmail: Scalars['String'];
};


export type MutationPasswordResetArgs = {
  password: Scalars['String'];
  recaptchaToken: Scalars['String'];
  resetToken: Scalars['String'];
};


export type MutationRegisterArgs = {
  email: Scalars['String'];
  name: Scalars['String'];
  password: Scalars['String'];
  recaptchaToken: Scalars['String'];
  registrationToken: Scalars['String'];
  username: Scalars['String'];
};


export type MutationRevokeRefreshArgs = {
  email?: Maybe<Scalars['String']>;
};


export type MutationSendPasswordResetArgs = {
  email: Scalars['String'];
  recaptchaToken: Scalars['String'];
};


export type MutationSendTestEmailArgs = {
  content?: Maybe<Scalars['String']>;
  email: Scalars['String'];
  name: Scalars['String'];
  subject?: Maybe<Scalars['String']>;
};


export type MutationUpdateAccountArgs = {
  avatar?: Maybe<Scalars['Upload']>;
  bio?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  email?: Maybe<Scalars['String']>;
  facebook?: Maybe<Scalars['String']>;
  github?: Maybe<Scalars['String']>;
  id?: Maybe<Scalars['String']>;
  jobTitle?: Maybe<Scalars['String']>;
  location?: Maybe<Scalars['String']>;
  locationName?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
  password?: Maybe<Scalars['String']>;
  twitter?: Maybe<Scalars['String']>;
  url?: Maybe<Scalars['String']>;
};


export type MutationUpdatePostArgs = {
  content?: Maybe<Scalars['String']>;
  id: Scalars['String'];
  link?: Maybe<Scalars['String']>;
  title?: Maybe<Scalars['String']>;
};


export type MutationUsernameExistsArgs = {
  recaptchaToken: Scalars['String'];
  username: Scalars['String'];
};


export type MutationVerifyEmailArgs = {
  token: Scalars['String'];
};

/** post data */
export type Post = {
  __typename?: 'Post';
  /** post content */
  content: Scalars['String'];
  /** date created */
  created: Scalars['Float'];
  /** post id */
  id: Scalars['String'];
  /** post link */
  link?: Maybe<Scalars['String']>;
  /** post publisher */
  publisher: Scalars['String'];
  /** title */
  title: Scalars['String'];
  /** post type */
  type: Scalars['String'];
  /** date updated */
  updated: Scalars['Float'];
};

/** post sort options */
export enum PostSortOption {
  Content = 'content',
  Created = 'created',
  Publisher = 'publisher',
  Title = 'title',
  Updated = 'updated'
}

/** post type */
export enum PostType {
  EncourageHer = 'encourageHer',
  MentorNews = 'mentorNews',
  StudentCommunity = 'studentCommunity',
  StudentNews = 'studentNews'
}

/** public user data (not in search) */
export type PublicUser = {
  __typename?: 'PublicUser';
  /** avatar id */
  avatar?: Maybe<Scalars['String']>;
  /** longer user bio */
  bio: Scalars['String'];
  /** short user description */
  description: Scalars['String'];
  /** email */
  email: Scalars['String'];
  /** facebook profile */
  facebook: Scalars['String'];
  /** github profile */
  github: Scalars['String'];
  /** user id */
  id: Scalars['String'];
  /** job title */
  jobTitle: Scalars['String'];
  /** location latitude longitude */
  location?: Maybe<Scalars['String']>;
  /** location name */
  locationName: Scalars['String'];
  /** major */
  major: Scalars['String'];
  /** name */
  name: Scalars['String'];
  /** twitter account */
  twitter: Scalars['String'];
  /** user type */
  type: Scalars['String'];
  /** personal url */
  url: Scalars['String'];
  /** username */
  username: Scalars['String'];
};

export type Query = {
  __typename?: 'Query';
  hello: Scalars['String'];
  media: Media;
  /** post data */
  post: Post;
  posts: SearchPostsResult;
  /** public user data */
  publicUser: PublicUser;
  /** user data */
  user: User;
  users: SearchUsersResult;
};


export type QueryMediaArgs = {
  id: Scalars['String'];
};


export type QueryPostArgs = {
  id: Scalars['String'];
};


export type QueryPostsArgs = {
  ascending?: Maybe<Scalars['Boolean']>;
  created?: Maybe<Scalars['Int']>;
  page?: Maybe<Scalars['Int']>;
  perpage?: Maybe<Scalars['Int']>;
  query?: Maybe<Scalars['String']>;
  sortBy?: Maybe<PostSortOption>;
  type?: Maybe<PostType>;
};


export type QueryPublicUserArgs = {
  id?: Maybe<Scalars['Float']>;
  username?: Maybe<Scalars['String']>;
};


export type QueryUsersArgs = {
  ascending?: Maybe<Scalars['Boolean']>;
  distance?: Maybe<Scalars['Float']>;
  location?: Maybe<Scalars['String']>;
  majors?: Maybe<Array<Scalars['String']>>;
  page?: Maybe<Scalars['Int']>;
  perpage?: Maybe<Scalars['Int']>;
  query?: Maybe<Scalars['String']>;
  sortBy?: Maybe<UserSortOption>;
  type?: Maybe<UserType>;
};

/** post data, indexed in elasticsearch */
export type SearchPost = {
  __typename?: 'SearchPost';
  /** post content */
  content: Scalars['String'];
  /** date created */
  created: Scalars['Float'];
  /** post id */
  id: Scalars['String'];
  /** post publisher */
  publisher: Scalars['String'];
  /** title */
  title: Scalars['String'];
  /** post type */
  type: Scalars['String'];
  /** date updated */
  updated: Scalars['Float'];
};

/** post data search results */
export type SearchPostsResult = {
  __typename?: 'SearchPostsResult';
  /** total posts count */
  count: Scalars['Int'];
  /** encourage her news count */
  countEncourageHer: Scalars['Int'];
  /** mentor news count */
  countMentorNews: Scalars['Int'];
  /** student community count */
  countStudentCommunity: Scalars['Int'];
  /** student news count */
  countStudentNews: Scalars['Int'];
  /** results */
  results: Array<SearchPost>;
};

/** user data, indexed for search */
export type SearchUser = {
  __typename?: 'SearchUser';
  /** email */
  email: Scalars['String'];
  /** user id */
  id: Scalars['String'];
  /** location latitude longitude */
  location?: Maybe<Scalars['String']>;
  /** location name */
  locationName: Scalars['String'];
  /** major */
  major: Scalars['String'];
  /** name */
  name: Scalars['String'];
  /** user type */
  type: Scalars['String'];
  /** username */
  username: Scalars['String'];
};

/** user data search results */
export type SearchUsersResult = {
  __typename?: 'SearchUsersResult';
  /** total users count */
  count: Scalars['Int'];
  /** results */
  results: Array<SearchUser>;
};


/** user account */
export type User = {
  __typename?: 'User';
  /** avatar id */
  avatar?: Maybe<Scalars['String']>;
  /** longer user bio */
  bio: Scalars['String'];
  /** short user description */
  description: Scalars['String'];
  /** email */
  email: Scalars['String'];
  /** email verified */
  emailVerified: Scalars['Boolean'];
  /** facebook profile */
  facebook: Scalars['String'];
  /** github profile */
  github: Scalars['String'];
  /** user id */
  id: Scalars['String'];
  /** job title */
  jobTitle: Scalars['String'];
  /** location latitude longitude */
  location?: Maybe<Scalars['String']>;
  /** location name */
  locationName: Scalars['String'];
  /** major */
  major: Scalars['String'];
  /** media auth token */
  mediaAuth: Scalars['String'];
  /** name */
  name: Scalars['String'];
  /** current token version */
  tokenVersion: Scalars['Float'];
  /** twitter account */
  twitter: Scalars['String'];
  /** user type */
  type: Scalars['String'];
  /** personal url */
  url: Scalars['String'];
  /** username */
  username: Scalars['String'];
};

/** user sort options */
export enum UserSortOption {
  Email = 'email',
  Location = 'location',
  Major = 'major',
  Name = 'name'
}

/** user type */
export enum UserType {
  Admin = 'admin',
  ThirdParty = 'thirdParty',
  User = 'user',
  Visitor = 'visitor'
}

export type DeleteAccountMutationVariables = Exact<{ [key: string]: never; }>;


export type DeleteAccountMutation = (
  { __typename?: 'Mutation' }
  & Pick<Mutation, 'deleteAccount'>
);

export type LoginMutationVariables = Exact<{
  usernameEmail: Scalars['String'];
  password: Scalars['String'];
  recaptchaToken: Scalars['String'];
}>;


export type LoginMutation = (
  { __typename?: 'Mutation' }
  & Pick<Mutation, 'login'>
);

export type LogoutMutationVariables = Exact<{ [key: string]: never; }>;


export type LogoutMutation = (
  { __typename?: 'Mutation' }
  & Pick<Mutation, 'logout'>
);

export type PasswordResetMutationVariables = Exact<{
  recaptchaToken: Scalars['String'];
  resetToken: Scalars['String'];
  password: Scalars['String'];
}>;


export type PasswordResetMutation = (
  { __typename?: 'Mutation' }
  & Pick<Mutation, 'passwordReset'>
);

export type RegisterMutationVariables = Exact<{
  registrationToken: Scalars['String'];
  username: Scalars['String'];
  name: Scalars['String'];
  email: Scalars['String'];
  password: Scalars['String'];
  recaptchaToken: Scalars['String'];
}>;


export type RegisterMutation = (
  { __typename?: 'Mutation' }
  & Pick<Mutation, 'register'>
);

export type SendPasswordResetMutationVariables = Exact<{
  recaptchaToken: Scalars['String'];
  email: Scalars['String'];
}>;


export type SendPasswordResetMutation = (
  { __typename?: 'Mutation' }
  & Pick<Mutation, 'sendPasswordReset'>
);

export type UpdateAccountMutationVariables = Exact<{
  email?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
  avatar?: Maybe<Scalars['Upload']>;
  jobTitle?: Maybe<Scalars['String']>;
  location?: Maybe<Scalars['String']>;
  locationName?: Maybe<Scalars['String']>;
  url?: Maybe<Scalars['String']>;
  facebook?: Maybe<Scalars['String']>;
  github?: Maybe<Scalars['String']>;
  twitter?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  bio?: Maybe<Scalars['String']>;
  password?: Maybe<Scalars['String']>;
}>;


export type UpdateAccountMutation = (
  { __typename?: 'Mutation' }
  & Pick<Mutation, 'updateAccount'>
);

export type UserFieldsFragment = (
  { __typename?: 'User' }
  & Pick<User, 'id' | 'name' | 'username' | 'email' | 'type' | 'avatar' | 'mediaAuth' | 'jobTitle' | 'location' | 'locationName' | 'url' | 'facebook' | 'github' | 'twitter' | 'description' | 'bio'>
);

export type UserQueryVariables = Exact<{ [key: string]: never; }>;


export type UserQuery = (
  { __typename?: 'Query' }
  & { user: (
    { __typename?: 'User' }
    & UserFieldsFragment
  ) }
);

export type VerifyEmailMutationVariables = Exact<{
  token: Scalars['String'];
}>;


export type VerifyEmailMutation = (
  { __typename?: 'Mutation' }
  & Pick<Mutation, 'verifyEmail'>
);

export const UserFields = gql`
    fragment userFields on User {
  id
  name
  username
  email
  type
  avatar
  mediaAuth
  jobTitle
  location
  locationName
  url
  facebook
  github
  twitter
  description
  bio
}
    `;
export const DeleteAccount = gql`
    mutation deleteAccount {
  deleteAccount
}
    `;
export const Login = gql`
    mutation login($usernameEmail: String!, $password: String!, $recaptchaToken: String!) {
  login(
    usernameEmail: $usernameEmail
    password: $password
    recaptchaToken: $recaptchaToken
  )
}
    `;
export const Logout = gql`
    mutation logout {
  logout
}
    `;
export const PasswordReset = gql`
    mutation passwordReset($recaptchaToken: String!, $resetToken: String!, $password: String!) {
  passwordReset(
    recaptchaToken: $recaptchaToken
    resetToken: $resetToken
    password: $password
  )
}
    `;
export const Register = gql`
    mutation register($registrationToken: String!, $username: String!, $name: String!, $email: String!, $password: String!, $recaptchaToken: String!) {
  register(
    registrationToken: $registrationToken
    username: $username
    name: $name
    email: $email
    password: $password
    recaptchaToken: $recaptchaToken
  )
}
    `;
export const SendPasswordReset = gql`
    mutation sendPasswordReset($recaptchaToken: String!, $email: String!) {
  sendPasswordReset(recaptchaToken: $recaptchaToken, email: $email)
}
    `;
export const UpdateAccount = gql`
    mutation updateAccount($email: String, $name: String, $avatar: Upload, $jobTitle: String, $location: String, $locationName: String, $url: String, $facebook: String, $github: String, $twitter: String, $description: String, $bio: String, $password: String) {
  updateAccount(
    email: $email
    name: $name
    avatar: $avatar
    jobTitle: $jobTitle
    location: $location
    locationName: $locationName
    url: $url
    facebook: $facebook
    github: $github
    twitter: $twitter
    description: $description
    bio: $bio
    password: $password
  )
}
    `;
export const User = gql`
    query user {
  user {
    ...userFields
  }
}
    ${UserFields}`;
export const VerifyEmail = gql`
    mutation verifyEmail($token: String!) {
  verifyEmail(token: $token)
}
    `;

      export interface PossibleTypesResultData {
        possibleTypes: {
          [key: string]: string[]
        }
      }
      const result: PossibleTypesResultData = {
  "possibleTypes": {}
};
      export default result;
    