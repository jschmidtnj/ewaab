import Feed from 'components/Feed';
import PrivateRoute from 'components/PrivateRoute';
import SEO from 'components/SEO';
import Layout from 'layouts/main';
import { PostType } from 'lib/generated/datamodel';
import { FunctionComponent } from 'react';

const ParticipantNewsPage: FunctionComponent = () => {
  return (
    <PrivateRoute>
      <Layout>
        <SEO page="participant news" />
        <Feed postType={PostType.EhParticipantNews} />
      </Layout>
    </PrivateRoute>
  );
};

export default ParticipantNewsPage;
