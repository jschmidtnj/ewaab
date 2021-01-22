import PrivateRoute from 'components/PrivateRoute';
import Layout from 'layouts/main';
import SEO from 'components/SEO';

const UsersPage = (): JSX.Element => {
  return (
    <PrivateRoute>
      <Layout>
        <SEO page="user page" />
        <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <p className="text-sm">
            stuff to go on this page name, major, link to user
          </p>
        </div>
      </Layout>
    </PrivateRoute>
  );
};

export default UsersPage;
