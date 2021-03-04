import type { AppProps } from 'next/app';
import { WrapApollo } from 'utils/apollo';
import { WrapRedux } from 'state/reduxWrapper';
import 'styles/global.scss';
import { FunctionComponent } from 'react';

const MyApp: FunctionComponent<AppProps> = ({
  Component,
  pageProps,
}: AppProps) => {
  return (
    <WrapRedux>
      <WrapApollo>
        <Component {...pageProps} />
      </WrapApollo>
    </WrapRedux>
  );
};

export default MyApp;
