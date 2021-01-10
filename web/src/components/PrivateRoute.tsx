import { isLoggedIn } from 'state/auth/getters';
import React, { useState, ReactNode, useEffect } from 'react';
import { isSSR } from 'utils/checkSSR';
import { useSelector } from 'react-redux';
import { RootState } from 'state';
import { useRouter } from 'next/dist/client/router';

interface PrivateRouteData {
  children?: ReactNode;
}

const PrivateRoute = (args: PrivateRouteData): JSX.Element => {
  const [isLoading, setLoading] = useState(true);
  const router = useRouter();
  useEffect(() => {
    (async () => {
      // trigger check to see if user is logged in
      const redirectParams = `?redirect=${encodeURIComponent(router.asPath)}`;
      try {
        const loggedIn = await isLoggedIn();
        if (!loggedIn) {
          router.push('/login' + redirectParams);
        } else {
          setLoading(false);
        }
      } catch (_err) {
        // handle error
        router.push('/login' + redirectParams);
      }
    })();
  }, []);
  const currentlyLoggedIn = isSSR
    ? undefined
    : useSelector<RootState, boolean | undefined>(
        (state) => state.authReducer.loggedIn
      );
  useEffect(() => {
    if (!currentlyLoggedIn) {
      setLoading(true);
      router.push('/login');
    }
  }, [currentlyLoggedIn]);
  return <>{isLoading ? null : args.children}</>;
};

export default PrivateRoute;
