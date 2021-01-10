import createWebStorage from 'redux-persist/lib/storage/createWebStorage';
import { isSSR } from './checkSSR';

const createNoopStorage = () => {
  return {
    getItem(_key: string) {
      return Promise.resolve(null);
    },
    setItem(_key: string, value: any) {
      return Promise.resolve(value);
    },
    removeItem(_key: string) {
      return Promise.resolve();
    },
  };
};

const storage = isSSR ? createNoopStorage() : createWebStorage('local');

export default storage;
