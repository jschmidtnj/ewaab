import Feed from 'components/Feed';
import PrivateRoute from 'components/PrivateRoute';
import SEO from 'components/SEO';
import Layout from 'layouts/main';
import { PostType } from 'lib/generated/datamodel';

const CommunityPage = (): JSX.Element => {
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
