import PrivateRoute from 'components/PrivateRoute';
import Layout from 'layouts/main';
import { useRouter } from 'next/dist/client/router';
import { useEffect } from 'react';
import { getType, getUsername, isLoggedIn } from 'state/auth/getters';
import SEO from 'components/SEO';
import { UserType } from 'lib/generated/datamodel';

const Index = (): JSX.Element => {
  const router = useRouter();
  useEffect(() => {
    (async () => {
      const loggedIn = await isLoggedIn();
      if (loggedIn) {
        const userType = getType();
        setTimeout(() => {
          if (userType === UserType.Admin) {
            router.push('/users');
          } else {
            const userName = getUsername();
            router.push(`/${userName}`);
          }
        }, 0);
      }
    })();
  }, []);
  return (
    <PrivateRoute>
      <Layout>
        <SEO page="home" />
        <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <p className="text-sm">redirecting...</p>
        </div>
      </Layout>
    </PrivateRoute>
  );
};

export default Index;
