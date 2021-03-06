import SEO from 'components/SEO';
import { FunctionComponent } from 'react';
import Layout from 'layouts/main';
import CatSVG from 'svg/cat.svg';
import Link from 'next/link';

const NotFoundPage: FunctionComponent = () => {
  return (
    <Layout>
      <SEO page="home" />
      <div className="flex items-center justify-center pt-40">
        <div className="container flex flex-col md:flex-row items-center justify-center px-4 text-gray-700">
          <div className="max-w-md">
            <div className="text-5xl font-dark font-bold">404</div>
            <p className="text-2xl md:text-3xl font-light leading-normal">
              Sorry we couldn{"'"}t find this page.
            </p>
            <p className="mb-8">
              But don{"'"}t worry, you can find plenty of other things on our
              homepage.
            </p>

            <Link href="/">
              <a className="px-4 inline py-2 text-sm font-medium leading-5 shadow text-white transition-colors duration-150 border border-transparent rounded-lg focus:outline-none focus:shadow-outline-blue bg-blue-600 active:bg-blue-600 hover:bg-blue-700">
                back to homepage
              </a>
            </Link>
          </div>
          <div className="max-w-lg w-full">
            <CatSVG />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NotFoundPage;
