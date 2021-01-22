import PrivateRoute from 'components/PrivateRoute';
import Layout from 'layouts/main';
import SEO from 'components/SEO';

const UserPage = (): JSX.Element => {
  return (
    <PrivateRoute>
      <Layout>
        <SEO page="user page" />
        <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <p className="text-sm">
            stuff to go on this page name, major, resume upload, bio /
            description all public to logged-in users, editable through modal
            use server-side to fetch data
          </p>
        </div>
      </Layout>
    </PrivateRoute>
  );
};

export default UserPage;
