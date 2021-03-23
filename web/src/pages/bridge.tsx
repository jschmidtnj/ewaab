import Feed from 'components/Feed';
import PrivateRoute from 'components/PrivateRoute';
import SEO from 'components/SEO';
import Layout from 'layouts/main';
import { PostType } from 'lib/generated/datamodel';
import { FunctionComponent } from 'react';

const BridgePage: FunctionComponent = () => {
  return (
    <PrivateRoute>
      <Layout>
        <SEO page="bridge" />
        <Feed postType={PostType.Bridge} />
      </Layout>
    </PrivateRoute>
  );
};

export default BridgePage;
