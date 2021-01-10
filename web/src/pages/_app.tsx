import type { AppProps } from 'next/app';
import { WrapApollo } from 'utils/apollo';
import { WrapRedux } from 'state/reduxWrapper';
import 'styles/global.scss';

const MyApp = ({ Component, pageProps }: AppProps): JSX.Element => {
  return (
    <WrapRedux>
      <WrapApollo>
        <Component {...pageProps} />
      </WrapApollo>
    </WrapRedux>
  );
};

export default MyApp;
