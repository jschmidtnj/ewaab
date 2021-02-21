import Feed from "components/Feed";
import PrivateRoute from "components/PrivateRoute";
import SEO from "components/SEO";
import Layout from "layouts/main";
import { PostType } from "lib/generated/datamodel";


const MentorNewsPage = (): JSX.Element => {
  return (
    <PrivateRoute>
      <Layout>
        <SEO page="mentor news" />
        <Feed postType={PostType.MentorNews} />
      </Layout>
    </PrivateRoute>
  )
};

export default MentorNewsPage;
