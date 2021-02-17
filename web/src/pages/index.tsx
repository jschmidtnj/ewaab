import PrivateRoute from 'components/PrivateRoute';
import Layout from 'layouts/main';
import { useRouter } from 'next/dist/client/router';
import { useEffect } from 'react';
import { isLoggedIn } from 'state/auth/getters';
import SEO from 'components/SEO';

const Index = (): JSX.Element => {
  const router = useRouter();
  useEffect(() => {
    (async () => {
      const loggedIn = await isLoggedIn();
      if (loggedIn) {
        setTimeout(() => {
          router.push('/users');
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
