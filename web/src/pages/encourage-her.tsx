import Feed from 'components/Feed';
import PrivateRoute from 'components/PrivateRoute';
import SEO from 'components/SEO';
import Layout from 'layouts/main';
import { PostType } from 'lib/generated/datamodel';
import { FunctionComponent } from 'react';

const EncourageHerPage: FunctionComponent = () => {
  return (
    <PrivateRoute>
      <Layout>
        <SEO page="encourage her" />
        <Feed postType={PostType.EncourageHer} />
      </Layout>
    </PrivateRoute>
  );
};

export default EncourageHerPage;
