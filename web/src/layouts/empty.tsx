import { FunctionComponent, ReactNode, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { IntlProvider } from 'react-intl';
import { useRouter } from 'next/dist/client/router';
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

const EmptyLayout: FunctionComponent<LayoutArgs> = (args: LayoutArgs) => {
  const router = useRouter();

  const currentTheme = Theme.light;
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
    <IntlProvider
      locale={router.locale}
      messages={(messages as unknown) as Record<string, string>}
    >
      <div className={currentTheme ? themeMap[currentTheme] : ''}>
        {args.children}
      </div>
    </IntlProvider>
  );
};

export default EmptyLayout;
