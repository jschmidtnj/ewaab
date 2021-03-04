import { FunctionComponent, ReactNode } from 'react';
import Header from 'components/Header';
import Footer from 'components/Footer';
import EmptyLayout from './empty';

interface LayoutArgs {
  children: ReactNode;
}

const Layout: FunctionComponent<LayoutArgs> = (args: LayoutArgs) => {
  return (
    <EmptyLayout>
      <Header />
      <main
        style={{
          minHeight: '90vh',
        }}
        className="bg-gray-100 dark:bg-gray-800"
      >
        {args.children}
      </main>
      <Footer />
    </EmptyLayout>
  );
};

export default Layout;
