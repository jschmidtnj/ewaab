import { isLoggedIn } from 'state/auth/getters';
import React, { useState, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/dist/client/router';
import { useSelector } from 'react-redux';
import { RootState } from 'state';
import { isSSR } from 'utils/checkSSR';

const checkAuthInterval = 5; // check every few minutes

interface PrivateRouteData {
  children?: ReactNode;
}

const PrivateRoute = (args: PrivateRouteData): JSX.Element => {
  const [isLoading, setLoading] = useState(true);
  const router = useRouter();

  const getRedirect = (): string =>
    `?redirect=${encodeURIComponent(router.asPath)}`;
  const checkLoggedIn = async (): Promise<boolean> => {
    try {
      const loggedIn = await isLoggedIn();
      if (!loggedIn) {
        router.push('/login' + getRedirect());
      }
      return loggedIn;
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
