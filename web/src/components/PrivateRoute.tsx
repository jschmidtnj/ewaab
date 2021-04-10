import { getType, isLoggedIn } from 'state/auth/getters';
import React, {
  useState,
  ReactNode,
  useEffect,
  FunctionComponent,
} from 'react';
import { useRouter } from 'next/dist/client/router';
import { useSelector } from 'react-redux';
import { RootState } from 'state';
import { isSSR } from 'utils/checkSSR';
import {
  adminPaths,
  allDefinedPaths,
  allowedVisitorPaths,
  dynamicAllowedVisitorPaths,
  feedPaths,
  linkMap,
  postViewMap,
} from 'utils/variables';
import { UserType } from 'lib/generated/datamodel';

const checkAuthInterval = 5; // check every few minutes

interface PrivateRouteArgs {
  children: ReactNode;
}

const PrivateRoute: FunctionComponent<PrivateRouteArgs> = (args) => {
  const [isLoading, setLoading] = useState(true);
  const router = useRouter();

  const getRedirect = (): string =>
    `?r=${encodeURIComponent(window.location.pathname)}`;

  const checkRoute = (): boolean => {
    const userType = getType();
    if (userType === UserType.Admin) {
      return true;
    } else if (adminPaths.includes(router.asPath)) {
      return false;
    }
    if (!allDefinedPaths.includes(router.asPath)) {
      // anyone can see user pages
      return true;
    }
    if (userType === UserType.Visitor) {
      if (
        !(
          dynamicAllowedVisitorPaths.includes(router.asPath) ||
          allowedVisitorPaths.some((elem) => elem.href === router.asPath)
        )
      ) {
        return false;
      }
    } else if (feedPaths.includes(router.asPath)) {
      return postViewMap[userType].some(
        (postType) => linkMap[postType].href === router.asPath
      );
    }
    return true;
  };

  const checkLoggedIn = async (): Promise<boolean> => {
    try {
      const loggedIn = await isLoggedIn();
      let routeAllowed = false;
      if (loggedIn) {
        routeAllowed = checkRoute();
        if (!routeAllowed) {
          router.push('/login');
        }
      } else {
        router.push('/login' + getRedirect());
      }
      return loggedIn && routeAllowed;
    } catch (_err) {
      // handle error
      router.push('/login' + getRedirect());
      return false;
    }
  };

  const [checkInterval, setCheckInterval] = useState<
    ReturnType<typeof setInterval> | undefined
  >(undefined);

  useEffect(() => {
    (async () => {
      // trigger check to see if user is logged in
      if (await checkLoggedIn()) {
        setLoading(false);
      }
    })();
    setCheckInterval(
      setInterval(async () => {
        await checkLoggedIn();
      }, checkAuthInterval * 60 * 1000)
    );
    return () => {
      if (checkInterval) {
        clearInterval(checkInterval);
      }
    };
  }, []);

  const currentlyLoggedIn = isSSR
    ? undefined
    : useSelector<RootState, boolean | undefined>(
        (state) => state.authReducer.loggedIn
      );
  useEffect(() => {
    if (!currentlyLoggedIn) {
      setLoading(true);
      router.push('/login' + getRedirect());
    }
  }, [currentlyLoggedIn]);

  return <>{isLoading ? null : args.children}</>;
};

export default PrivateRoute;
