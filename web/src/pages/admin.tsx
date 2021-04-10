import PrivateRoute from 'components/PrivateRoute';
import SEO from 'components/SEO';
import Layout from 'layouts/main';
import { FunctionComponent } from 'react';

const Admin: FunctionComponent = () => {
  return (
    <PrivateRoute>
      <Layout>
        <SEO page="admin" />
        <div className="max-w-5xl mx-auto px-2 sm:px-6 lg:px-8 flex justify-center pt-28">
          <div>
            <h2 className="mt-6 text-center text-4xl font-medium text-gray-900">
              Admin Invite User
            </h2>
          </div>
        </div>
      </Layout>
    </PrivateRoute>
  );
};

export default Admin;
