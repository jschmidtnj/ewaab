import React, { FunctionComponent, ReactNode } from 'react';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware, compose } from 'redux';
import { PersistGate } from 'redux-persist/integration/react';
import { persistStore, persistReducer } from 'redux-persist';
import { createWhitelistFilter } from 'redux-persist-transform-filter';
import rootReducer from '.';
import thunk from 'redux-thunk';
import storage from 'utils/storage';
import { isSSR } from 'utils/checkSSR';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION__: any;
    devToolsExtension: any;
  }
}

const loadDevTools = (): any =>
  process.env.NODE_ENV === 'development' &&
  !isSSR &&
  window &&
  window.devToolsExtension
    ? window.__REDUX_DEVTOOLS_EXTENSION__ &&
      window.__REDUX_DEVTOOLS_EXTENSION__()
    : (f: any) => f;

// https://gist.github.com/azamatsmith/ab814c869e81dc01b07782be0493ebcd
const persistedReducer = persistReducer(
  {
    key: 'ewaab-internal-network',
    storage,
    transforms: [
      createWhitelistFilter('authReducer', [
        'loggedIn',
        'username',
        'userType',
      ]),
    ],
    blacklist: ['searchReducer'],
  },
  rootReducer
);

export const store = createStore(
  persistedReducer,
  compose(applyMiddleware(thunk), loadDevTools())
);

const persistor = persistStore(store as any);

interface WrapReduxArgs {
  children: ReactNode;
}

export const WrapRedux: FunctionComponent<WrapReduxArgs> = (args) => (
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      {args.children}
    </PersistGate>
  </Provider>
);
