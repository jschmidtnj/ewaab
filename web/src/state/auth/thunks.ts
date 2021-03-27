import { AppThunkAction } from '../thunk';
import { client } from 'utils/apollo';
import { login, setUser, logout } from './actions';
import {
  Logout,
  LogoutMutation,
  LoginMutationVariables,
  LoginMutation,
  Login,
  LogoutMutationVariables,
  User,
  UserQuery,
  UserQueryVariables,
  UserFieldsFragment,
  LoginVisitorMutation,
  LoginVisitorMutationVariables,
  LoginVisitor,
  LoginOutput,
  UserType,
} from 'lib/generated/datamodel';
import * as Sentry from '@sentry/browser';

const loginMutation = async (
  args: LoginMutationVariables
): Promise<LoginOutput> => {
  const apolloRes = await client.mutate<LoginMutation, LoginMutationVariables>({
    mutation: Login,
    variables: args,
  });
  if (apolloRes.data) {
    Sentry.setUser({ username: args.usernameEmail });
    return apolloRes.data.login;
  } else {
    throw new Error('cannot find apollo data');
  }
};

export const thunkLogin = (
  args: LoginMutationVariables
): AppThunkAction<Promise<void>> => async (dispatch) => {
  const data = await loginMutation(args);
  dispatch(
    login({
      authToken: data.token,
      userType: data.type,
      loggedIn: true,
    })
  );
};

const loginVisitorMutation = async (
  args: LoginVisitorMutationVariables
): Promise<string> => {
  const apolloRes = await client.mutate<
    LoginVisitorMutation,
    LoginVisitorMutationVariables
  >({
    mutation: LoginVisitor,
    variables: args,
  });
  if (apolloRes.data) {
    Sentry.setUser({ username: args.code });
    return apolloRes.data.loginVisitor;
  } else {
    throw new Error('cannot find apollo data');
  }
};

export const thunkLoginVisitor = (
  args: LoginVisitorMutationVariables
): AppThunkAction<Promise<void>> => async (dispatch) => {
  const authToken = await loginVisitorMutation(args);
  dispatch(
    login({
      authToken,
      loggedIn: true,
      userType: UserType.Visitor,
    })
  );
};

export const runLogout = async (): Promise<string> => {
  const apolloRes = await client.mutate<
    LogoutMutation,
    LogoutMutationVariables
  >({
    mutation: Logout,
    variables: {},
  });
  if (apolloRes.data) {
    Sentry.configureScope((scope) => scope.setUser(null));
    return apolloRes.data.logout;
  } else {
    throw new Error('cannot find apollo data');
  }
};

export const thunkLogout = (): AppThunkAction<Promise<void>> => async (
  dispatch
) => {
  await runLogout();
  dispatch(logout());
};

const getUser = async (): Promise<UserFieldsFragment> => {
  const apolloRes = await client.query<UserQuery, UserQueryVariables>({
    query: User,
    variables: {},
    fetchPolicy: 'no-cache', // disable cache
  });
  if (apolloRes.data) {
    return apolloRes.data.user;
  } else {
    throw new Error('cannot find apollo data');
  }
};

export const thunkGetUser = (): AppThunkAction<Promise<void>> => async (
  dispatch
) => {
  const user = await getUser();
  dispatch(setUser(user));
};
