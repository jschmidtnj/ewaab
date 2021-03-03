import SEO from 'components/SEO';
import Image from 'next/image';
import EmptyLayout from 'layouts/empty';
import Link from 'next/link';
import Header from 'components/Header';

const Index = (): JSX.Element => {
  return (
    <EmptyLayout>
      <SEO page="home" />
      <Header />
      <div className="absolute top-20 w-full h-full">
        <Image
          src="/assets/img/homepage_background.png"
          layout="fill"
          objectFit="cover"
        />
      </div>
      <div className="z-10 absolute top-0 mt-20 w-screen h-full">
        <div className="relative bg-gray-900 opacity-20 h-full" />
      </div>
      <div className="z-20 absolute top-20 inset-0 flex justify-center items-center text-white">
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
              <Link href="/login">
                <a
                  href="/login"
                  className="mt-8 py-2 px-10 opacity-70 shadow-md no-underline rounded-full bg-blue-700 font-medium text-md btn-primary hover:bg-pink-600 focus:outline-none active:shadow-none mr-2"
                >
                  Login
                </a>
              </Link>
            </div>
          </div>
          <div />
        </div>
      </div>
    </EmptyLayout>
  );
};

export default Index;
