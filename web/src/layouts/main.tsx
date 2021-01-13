import { ReactNode, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { IntlProvider } from 'react-intl';
import 'react-toastify/dist/ReactToastify.css';
import { useRouter } from 'next/dist/client/router';
import Header from 'components/Header';
import Footer from 'components/Footer';
import { Theme, themeMap } from 'utils/theme';
import Messages from 'locale/type';

toast.configure({
  autoClose: 4000,
  draggable: false,
  newestOnTop: true,
  position: 'top-right',
  pauseOnFocusLoss: false,
  pauseOnHover: true,
});

interface LayoutArgs {
  children: ReactNode;
}

// TODO - see https://github.com/staylor/react-helmet-async/issues/26
// try adding react-helmet-async to this

const Layout = (args: LayoutArgs): JSX.Element => {
  const router = useRouter();

  const currentTheme = Theme.dark;
  const [messages, setMessages] = useState<Messages | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  useEffect(() => {
    (async () => {
      const importedMessages: Messages = (
        await import(`locale/${router.locale}`)
      ).default;
      setMessages(importedMessages);
      setLoading(false);
    })();
  }, []);

  return loading ? null : (
    <IntlProvider locale={router.locale} messages={messages}>
      <div
        className={currentTheme ? themeMap[currentTheme] : ''}
        style={{
          minHeight: '105vh',
        }}
      >
        <Header />
        <main className="bg-gray-50 dark:bg-gray-800">{args.children}</main>
        <Footer />
      </div>
    </IntlProvider>
  );
};

export default Layout;
