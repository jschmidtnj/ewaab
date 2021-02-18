import gql from 'graphql-tag';
export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> &
  { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> &
  { [SubKey in K]: Maybe<T[SubKey]> };
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

/** media data */
export type MediaData = {
  __typename?: 'MediaData';
  /** file size */
  fileSize: Scalars['Float'];
  id: Scalars['String'];
  /** mime type of file */
  mime: Scalars['String'];
  /** file name */
  name: Scalars['String'];
};

export type Mutation = {
  __typename?: 'Mutation';
  addPost: Scalars['String'];
  deleteAccount: Scalars['String'];
  deletePost: Scalars['String'];
  inviteUser: Scalars['String'];
  login: Scalars['String'];
  loginGuest: Scalars['String'];
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
  link?: Maybe<Scalars['String']>;
  media?: Maybe<Scalars['Upload']>;
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
  major?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
  password?: Maybe<Scalars['String']>;
  resume?: Maybe<Scalars['Upload']>;
  twitter?: Maybe<Scalars['String']>;
  url?: Maybe<Scalars['String']>;
};

export type MutationUpdatePostArgs = {
  content?: Maybe<Scalars['String']>;
  deleteMedia?: Maybe<Scalars['Boolean']>;
  id: Scalars['String'];
  link?: Maybe<Scalars['String']>;
  media?: Maybe<Scalars['Upload']>;
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
  /** media for post */
  media?: Maybe<Scalars['String']>;
  /** media data */
  mediaData?: Maybe<MediaData>;
  /** post publisher */
  publisher: Scalars['String'];
  /** publisher user data */
  publisherData?: Maybe<PostPublisherData>;
  /** title */
  title: Scalars['String'];
  /** post type */
  type: Scalars['String'];
  /** date updated */
  updated: Scalars['Float'];
};

/** post count data */
export type PostCount = {
  __typename?: 'PostCount';
  /** posts count */
  count: Scalars['Int'];
  /** post type for count */
  type: PostType;
};

/** user data that you can get from post search */
export type PostPublisherData = {
  __typename?: 'PostPublisherData';
  /** avatar id */
  avatar?: Maybe<Scalars['String']>;
  /** date created */
  created: Scalars['Float'];
  /** short user description */
  description: Scalars['String'];
  /** user id */
  id: Scalars['String'];
  /** name */
  name: Scalars['String'];
  /** date updated */
  updated: Scalars['Float'];
  /** username */
  username: Scalars['String'];
};

/** post sort options */
export enum PostSortOption {
  Created = 'created',
  Publisher = 'publisher',
  Title = 'title',
  Updated = 'updated',
}

/** post type */
export enum PostType {
  Community = 'community',
  EncourageHer = 'encourageHer',
  MentorNews = 'mentorNews',
  StudentNews = 'studentNews',
}

/** public user data (not in search) */
export type PublicUser = {
  __typename?: 'PublicUser';
  /** avatar id */
  avatar?: Maybe<Scalars['String']>;
  /** longer user bio */
  bio: Scalars['String'];
  /** date created */
  created: Scalars['Float'];
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
  /** resume id */
  resume?: Maybe<Scalars['String']>;
  /** twitter account */
  twitter: Scalars['String'];
  /** user type */
  type: Scalars['String'];
  /** date updated */
  updated: Scalars['Float'];
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
  postCounts?: Maybe<Array<PostType>>;
  publisher?: Maybe<Scalars['String']>;
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
  /** post link */
  link?: Maybe<Scalars['String']>;
  /** media for post */
  media?: Maybe<Scalars['String']>;
  /** media data */
  mediaData?: Maybe<MediaData>;
  /** post publisher */
  publisher: Scalars['String'];
  /** publisher user data */
  publisherData?: Maybe<PostPublisherData>;
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
  /** aggregate counts of posts */
  postCounts: Array<PostCount>;
  /** results */
  results: Array<SearchPost>;
};

/** user data, indexed for search */
export type SearchUser = {
  __typename?: 'SearchUser';
  /** avatar id */
  avatar?: Maybe<Scalars['String']>;
  /** date created */
  created: Scalars['Float'];
  /** short user description */
  description: Scalars['String'];
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
  /** date updated */
  updated: Scalars['Float'];
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
  /** date created */
  created: Scalars['Float'];
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
  /** resume id */
  resume?: Maybe<Scalars['String']>;
  /** current token version */
  tokenVersion: Scalars['Float'];
  /** twitter account */
  twitter: Scalars['String'];
  /** user type */
  type: Scalars['String'];
  /** date updated */
  updated: Scalars['Float'];
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
  Name = 'name',
}

/** user type */
export enum UserType {
  Admin = 'admin',
  Mentor = 'mentor',
  User = 'user',
  Visitor = 'visitor',
}

export type AddPostMutationVariables = Exact<{
  title: Scalars['String'];
  content: Scalars['String'];
  type: PostType;
  link?: Maybe<Scalars['String']>;
  media?: Maybe<Scalars['Upload']>;
}>;

export type AddPostMutation = { __typename?: 'Mutation' } & Pick<
  Mutation,
  'addPost'
>;

export type DeletePostMutationVariables = Exact<{
  id: Scalars['String'];
}>;

export type DeletePostMutation = { __typename?: 'Mutation' } & Pick<
  Mutation,
  'deletePost'
>;

export type PostUpdateDataQueryVariables = Exact<{
  id: Scalars['String'];
}>;

export type PostUpdateDataQuery = { __typename?: 'Query' } & {
  post: { __typename?: 'Post' } & Pick<Post, 'title' | 'content' | 'link'> & {
      mediaData?: Maybe<
        { __typename?: 'MediaData' } & Pick<MediaData, 'id' | 'mime'>
      >;
    };
};

export type PostSearchFieldsFragment = { __typename?: 'SearchPost' } & Pick<
  SearchPost,
  'id' | 'title' | 'content' | 'publisher' | 'created' | 'updated'
> & {
    publisherData?: Maybe<
      { __typename?: 'PostPublisherData' } & Pick<
        PostPublisherData,
        'name' | 'username' | 'avatar' | 'description'
      >
    >;
  };

export type PostsQueryVariables = Exact<{
  query?: Maybe<Scalars['String']>;
  type?: Maybe<PostType>;
  page?: Maybe<Scalars['Int']>;
  perpage?: Maybe<Scalars['Int']>;
  ascending?: Maybe<Scalars['Boolean']>;
  publisher?: Maybe<Scalars['String']>;
}>;

export type PostsQuery = { __typename?: 'Query' } & {
  posts: { __typename?: 'SearchPostsResult' } & Pick<
    SearchPostsResult,
    'count'
  > & {
      results: Array<{ __typename?: 'SearchPost' } & PostSearchFieldsFragment>;
      postCounts: Array<
        { __typename?: 'PostCount' } & Pick<PostCount, 'type' | 'count'>
      >;
    };
};

export type UpdatePostMutationVariables = Exact<{
  id: Scalars['String'];
  title?: Maybe<Scalars['String']>;
  content?: Maybe<Scalars['String']>;
  link?: Maybe<Scalars['String']>;
  media?: Maybe<Scalars['Upload']>;
}>;

export type UpdatePostMutation = { __typename?: 'Mutation' } & Pick<
  Mutation,
  'updatePost'
>;

export type DeleteAccountMutationVariables = Exact<{ [key: string]: never }>;

export type DeleteAccountMutation = { __typename?: 'Mutation' } & Pick<
  Mutation,
  'deleteAccount'
>;

export type LoginMutationVariables = Exact<{
  usernameEmail: Scalars['String'];
  password: Scalars['String'];
  recaptchaToken: Scalars['String'];
}>;

export type LoginMutation = { __typename?: 'Mutation' } & Pick<
  Mutation,
  'login'
>;

export type LoginGuestMutationVariables = Exact<{ [key: string]: never }>;

export type LoginGuestMutation = { __typename?: 'Mutation' } & Pick<
  Mutation,
  'loginGuest'
>;

export type LogoutMutationVariables = Exact<{ [key: string]: never }>;

export type LogoutMutation = { __typename?: 'Mutation' } & Pick<
  Mutation,
  'logout'
>;

export type PasswordResetMutationVariables = Exact<{
  recaptchaToken: Scalars['String'];
  resetToken: Scalars['String'];
  password: Scalars['String'];
}>;

export type PasswordResetMutation = { __typename?: 'Mutation' } & Pick<
  Mutation,
  'passwordReset'
>;

export type PublicUserFieldsFragment = { __typename?: 'PublicUser' } & Pick<
  PublicUser,
  | 'name'
  | 'username'
  | 'email'
  | 'major'
  | 'resume'
  | 'locationName'
  | 'avatar'
  | 'jobTitle'
  | 'url'
  | 'facebook'
  | 'twitter'
  | 'github'
  | 'description'
  | 'bio'
>;

export type PublicUserQueryVariables = Exact<{
  username: Scalars['String'];
}>;

export type PublicUserQuery = { __typename?: 'Query' } & {
  publicUser: { __typename?: 'PublicUser' } & PublicUserFieldsFragment;
};

export type RegisterMutationVariables = Exact<{
  registrationToken: Scalars['String'];
  username: Scalars['String'];
  name: Scalars['String'];
  email: Scalars['String'];
  password: Scalars['String'];
  recaptchaToken: Scalars['String'];
}>;

export type RegisterMutation = { __typename?: 'Mutation' } & Pick<
  Mutation,
  'register'
>;

export type SendPasswordResetMutationVariables = Exact<{
  recaptchaToken: Scalars['String'];
  email: Scalars['String'];
}>;

export type SendPasswordResetMutation = { __typename?: 'Mutation' } & Pick<
  Mutation,
  'sendPasswordReset'
>;

export type UpdateAccountMutationVariables = Exact<{
  email?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
  avatar?: Maybe<Scalars['Upload']>;
  resume?: Maybe<Scalars['Upload']>;
  jobTitle?: Maybe<Scalars['String']>;
  location?: Maybe<Scalars['String']>;
  locationName?: Maybe<Scalars['String']>;
  url?: Maybe<Scalars['String']>;
  facebook?: Maybe<Scalars['String']>;
  github?: Maybe<Scalars['String']>;
  twitter?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  major?: Maybe<Scalars['String']>;
  bio?: Maybe<Scalars['String']>;
  password?: Maybe<Scalars['String']>;
}>;

export type UpdateAccountMutation = { __typename?: 'Mutation' } & Pick<
  Mutation,
  'updateAccount'
>;

export type UserFieldsFragment = { __typename?: 'User' } & Pick<
  User,
  | 'id'
  | 'name'
  | 'username'
  | 'email'
  | 'major'
  | 'resume'
  | 'type'
  | 'avatar'
  | 'mediaAuth'
  | 'jobTitle'
  | 'location'
  | 'locationName'
  | 'url'
  | 'facebook'
  | 'github'
  | 'twitter'
  | 'description'
  | 'bio'
>;

export type UserQueryVariables = Exact<{ [key: string]: never }>;

export type UserQuery = { __typename?: 'Query' } & {
  user: { __typename?: 'User' } & UserFieldsFragment;
};

export type UsersQueryVariables = Exact<{
  query?: Maybe<Scalars['String']>;
  type?: Maybe<UserType>;
  majors?: Maybe<Array<Scalars['String']> | Scalars['String']>;
  sortBy?: Maybe<UserSortOption>;
  ascending?: Maybe<Scalars['Boolean']>;
  page?: Maybe<Scalars['Int']>;
  perpage?: Maybe<Scalars['Int']>;
}>;

export type UsersQuery = { __typename?: 'Query' } & {
  users: { __typename?: 'SearchUsersResult' } & Pick<
    SearchUsersResult,
    'count'
  > & {
      results: Array<
        { __typename?: 'SearchUser' } & Pick<
          SearchUser,
          'name' | 'username' | 'type' | 'major' | 'avatar'
        >
      >;
    };
};

export type VerifyEmailMutationVariables = Exact<{
  token: Scalars['String'];
}>;

export type VerifyEmailMutation = { __typename?: 'Mutation' } & Pick<
  Mutation,
  'verifyEmail'
>;

export const PostSearchFields = gql`
  fragment postSearchFields on SearchPost {
    id
    title
    content
    publisher
    created
    updated
    publisherData {
      name
      username
      avatar
      description
    }
  }
`;
export const PublicUserFields = gql`
  fragment publicUserFields on PublicUser {
    name
    username
    email
    major
    resume
    locationName
    avatar
    jobTitle
    url
    facebook
    twitter
    github
    description
    bio
  }
`;
export const UserFields = gql`
  fragment userFields on User {
    id
    name
    username
    email
    major
    resume
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
export const AddPost = gql`
  mutation addPost(
    $title: String!
    $content: String!
    $type: PostType!
    $link: String
    $media: Upload
  ) {
    addPost(
      title: $title
      content: $content
      type: $type
      link: $link
      media: $media
    )
  }
`;
export const DeletePost = gql`
  mutation deletePost($id: String!) {
    deletePost(id: $id)
  }
`;
export const PostUpdateData = gql`
  query postUpdateData($id: String!) {
    post(id: $id) {
      title
      content
      link
      mediaData {
        id
        mime
      }
    }
  }
`;
export const Posts = gql`
  query posts(
    $query: String
    $type: PostType
    $page: Int
    $perpage: Int
    $ascending: Boolean
    $publisher: String
  ) {
    posts(
      query: $query
      type: $type
      page: $page
      perpage: $perpage
      ascending: $ascending
      publisher: $publisher
    ) {
      results {
        ...postSearchFields
      }
      count
      postCounts {
        type
        count
      }
    }
  }
  ${PostSearchFields}
`;
export const UpdatePost = gql`
  mutation updatePost(
    $id: String!
    $title: String
    $content: String
    $link: String
    $media: Upload
  ) {
    updatePost(
      id: $id
      title: $title
      content: $content
      link: $link
      media: $media
    )
  }
`;
export const DeleteAccount = gql`
  mutation deleteAccount {
    deleteAccount
  }
`;
export const Login = gql`
  mutation login(
    $usernameEmail: String!
    $password: String!
    $recaptchaToken: String!
  ) {
    login(
      usernameEmail: $usernameEmail
      password: $password
      recaptchaToken: $recaptchaToken
    )
  }
`;
export const LoginGuest = gql`
  mutation loginGuest {
    loginGuest
  }
`;
export const Logout = gql`
  mutation logout {
    logout
  }
`;
export const PasswordReset = gql`
  mutation passwordReset(
    $recaptchaToken: String!
    $resetToken: String!
    $password: String!
  ) {
    passwordReset(
      recaptchaToken: $recaptchaToken
      resetToken: $resetToken
      password: $password
    )
  }
`;
export const PublicUser = gql`
  query publicUser($username: String!) {
    publicUser(username: $username) {
      ...publicUserFields
    }
  }
  ${PublicUserFields}
`;
export const Register = gql`
  mutation register(
    $registrationToken: String!
    $username: String!
    $name: String!
    $email: String!
    $password: String!
    $recaptchaToken: String!
  ) {
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
  mutation updateAccount(
    $email: String
    $name: String
    $avatar: Upload
    $resume: Upload
    $jobTitle: String
    $location: String
    $locationName: String
    $url: String
    $facebook: String
    $github: String
    $twitter: String
    $description: String
    $major: String
    $bio: String
    $password: String
  ) {
    updateAccount(
      email: $email
      name: $name
      avatar: $avatar
      resume: $resume
      jobTitle: $jobTitle
      location: $location
      locationName: $locationName
      url: $url
      facebook: $facebook
      github: $github
      twitter: $twitter
      description: $description
      major: $major
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
  ${UserFields}
`;
export const Users = gql`
  query users(
    $query: String
    $type: UserType
    $majors: [String!]
    $sortBy: UserSortOption
    $ascending: Boolean
    $page: Int
    $perpage: Int
  ) {
    users(
      query: $query
      type: $type
      majors: $majors
      sortBy: $sortBy
      ascending: $ascending
      page: $page
      perpage: $perpage
    ) {
      count
      results {
        name
        username
        type
        major
        avatar
      }
    }
  }
`;
export const VerifyEmail = gql`
  mutation verifyEmail($token: String!) {
    verifyEmail(token: $token)
  }
`;

export interface PossibleTypesResultData {
  possibleTypes: {
    [key: string]: string[];
  };
}
const result: PossibleTypesResultData = {
  possibleTypes: {},
};
export default result;
