import Feed from 'components/Feed';
import PrivateRoute from 'components/PrivateRoute';
import SEO from 'components/SEO';
import Layout from 'layouts/main';
import { PostType } from 'lib/generated/datamodel';
import { FunctionComponent } from 'react';

const CommunityPage: FunctionComponent = () => {
  return (
    <PrivateRoute>
      <Layout>
        <SEO page="community" />
        <Feed postType={PostType.Community} />
      </Layout>
    </PrivateRoute>
  );
};

export default CommunityPage;
