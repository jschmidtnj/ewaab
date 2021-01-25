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

/** device object */
export type Device = {
  __typename?: 'Device';
  /** is device activated */
  activated: Scalars['Boolean'];
  /** activation code */
  activationCode: Scalars['String'];
  /** id of user that can send thinking of you commands (and vice-versa) */
  connection: Scalars['Float'];
  id: Scalars['Float'];
  /** current mode */
  mode: Scalars['String'];
  /** device name */
  name: Scalars['String'];
  /** owner */
  owner: Scalars['Float'];
  /** device type */
  type: Scalars['String'];
};

/** media object */
export type Media = {
  __typename?: 'Media';
  /** file size */
  fileSize: Scalars['Float'];
  id: Scalars['Float'];
  /** mime type of file */
  mime: Scalars['String'];
  /** file name */
  name: Scalars['String'];
  /** owner */
  user: Scalars['Float'];
};

export type Mutation = {
  __typename?: 'Mutation';
  deleteAccount: Scalars['String'];
  inviteUser: Scalars['String'];
  login: Scalars['String'];
  logout: Scalars['String'];
  passwordReset: Scalars['String'];
  register: Scalars['String'];
  revokeRefresh: Scalars['String'];
  sendPasswordReset: Scalars['String'];
  sendTestEmail: Scalars['String'];
  updateAccount: Scalars['String'];
  usernameExists: Scalars['Boolean'];
  verifyEmail: Scalars['String'];
};


export type MutationDeleteAccountArgs = {
  email?: Maybe<Scalars['String']>;
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
  email?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
  password?: Maybe<Scalars['String']>;
};


export type MutationUsernameExistsArgs = {
  recaptchaToken: Scalars['String'];
  username: Scalars['String'];
};


export type MutationVerifyEmailArgs = {
  token: Scalars['String'];
};

/** public user data */
export type PublicUser = {
  __typename?: 'PublicUser';
  /** avatar id */
  avatar: Scalars['Float'];
  /** email */
  email: Scalars['String'];
  /** name */
  name: Scalars['String'];
  /** user type */
  type: Scalars['String'];
  /** username */
  username: Scalars['String'];
};

export type Query = {
  __typename?: 'Query';
  hello: Scalars['String'];
  media: Media;
  /** public user data */
  publicUser: PublicUser;
  /** user data */
  user: User;
};


export type QueryMediaArgs = {
  id?: Maybe<Scalars['Float']>;
};


export type QueryPublicUserArgs = {
  id?: Maybe<Scalars['Float']>;
  username?: Maybe<Scalars['String']>;
};


/** user account */
export type User = {
  __typename?: 'User';
  /** avatar id */
  avatar: Scalars['Float'];
  /** email */
  email: Scalars['String'];
  /** email verified */
  emailVerified: Scalars['Boolean'];
  id: Scalars['Float'];
  /** media auth token */
  mediaAuth: Scalars['String'];
  /** name */
  name: Scalars['String'];
  /** current token version */
  tokenVersion: Scalars['Float'];
  /** user type */
  type: Scalars['String'];
  /** username */
  username: Scalars['String'];
};

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
  password?: Maybe<Scalars['String']>;
  avatar?: Maybe<Scalars['Upload']>;
}>;


export type UpdateAccountMutation = (
  { __typename?: 'Mutation' }
  & Pick<Mutation, 'updateAccount'>
);

export type UserFieldsFragment = (
  { __typename?: 'User' }
  & Pick<User, 'name' | 'username' | 'email' | 'id' | 'type' | 'avatar' | 'mediaAuth'>
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
  name
  username
  email
  id
  type
  avatar
  mediaAuth
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
    mutation updateAccount($email: String, $name: String, $password: String, $avatar: Upload) {
  updateAccount(email: $email, name: $name, password: $password, avatar: $avatar)
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
    