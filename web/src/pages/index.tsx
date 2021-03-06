import SEO from 'components/SEO';
import Image from 'next/image';
import Link from 'next/link';
import Header from 'components/Header';
import EmptyLayout from 'layouts/empty';
import Footer from 'components/Footer';
import { FunctionComponent } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from 'state';
import {
  defaultLoggedInPage,
  defaultLoggedInPageVisitor,
} from 'utils/variables';
import { UserType } from 'lib/generated/datamodel';

const Index: FunctionComponent = () => {
  const loggedIn = useSelector<RootState, boolean>(
    (state) => state.authReducer.loggedIn
  );
  const userType = useSelector<RootState, UserType>(
    (state) => state.authReducer.userType
  );
  return (
    <EmptyLayout>
      <SEO page="home" />
      <Header />
      <div className="absolute top-16 left-0 right-0 bottom-0">
        <Image
          src="/assets/img/homepage_background.png"
          layout="fill"
          objectFit="cover"
          alt="ewaab-home"
        />
        <div className="z-10 absolute inset-0">
          <div className="relative bg-gray-900 opacity-20 h-full" />
        </div>
        <div className="z-20 absolute inset-0 flex justify-center items-center text-white">
          <div className="m-4 grid sm:grid-cols-2">
            <div className="my-4">
              <div className="sm:text-5xl text-4xl">
                <div className="flex justify-left mb-2">
                  <h1>Start Your Career,</h1>
                </div>
                <div className="flex justify-left">
                  <h1>Build Your Network</h1>
                </div>
              </div>
              <div className="flex justify-left items-center">
                <Link
                  href={
                    !loggedIn
                      ? '/login'
                      : userType === UserType.Visitor
                      ? defaultLoggedInPageVisitor
                      : defaultLoggedInPage
                  }
                >
                  <a className="mt-8 py-2 px-10 opacity-70 shadow-md no-underline rounded-full bg-blue-700 font-medium text-md btn-primary hover:bg-pink-600 active:shadow-none mr-2">
                    {!loggedIn ? 'Login' : 'Enter'}
                  </a>
                </Link>
              </div>
            </div>
            <div />
          </div>
        </div>
      </div>
      <div
        className="absolute w-full"
        style={{
          bottom: -56,
        }}
      >
        <Footer />
      </div>
    </EmptyLayout>
  );
};

export default Index;
