import SEO from 'components/SEO';
import Image from 'next/image';
import EmptyLayout from 'layouts/empty';
import Link from 'next/link';

const Index = (): JSX.Element => {
  return (
    <EmptyLayout>
      <SEO page="home" />
      <Image
        src="/assets/img/homepage_background.png"
        layout="fill"
        objectFit="cover"
      />
      <div className="z-10 absolute inset-0 flex justify-center items-center text-white">
        <div className="m-4">
          <h1 className="mb-4 sm:text-5xl text-3xl">Welcome to ConnectHer</h1>
          <div className="flex sm:justify-center justify-start my-4">
            <hr className="border-red-400 border-2 rounded-sm w-10" />
          </div>
          <div className="flex justify-center my-4">
            <h2 className="sm:text-lg text-md">
              A social network for the women of EWAAB
            </h2>
          </div>
          <div className="flex justify-center my-4">
            <Link href="/login">
              <a
                href="/login"
                className="py-2 px-4 shadow-md no-underline rounded-full bg-red-600 font-medium text-md btn-primary hover:bg-pink-600 focus:outline-none active:shadow-none mr-2"
              >
                Start Session
              </a>
            </Link>
          </div>
        </div>
      </div>
    </EmptyLayout>
  );
};

export default Index;
