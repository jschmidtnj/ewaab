import { ApolloError } from '@apollo/react-hooks';
import { KeyboardEvent } from 'react';

export const locales: string[] = ['en'];

export const capitalizeOnlyFirstLetter = (elem: string): string => {
  return elem.charAt(0).toUpperCase() + elem.slice(1);
};

export const capitalizeFirstLetter = (elem: string): string => {
  return elem.split(' ').map(capitalizeOnlyFirstLetter).join(' ');
};

export const getErrorCode = (err: ApolloError): number | null => {
  if (err.graphQLErrors.length > 0) {
    const graphqlError = err.graphQLErrors[0];
    if ('code' in graphqlError.extensions) {
      const errorCodeObj = new Number(graphqlError.extensions['code']);
      if (errorCodeObj) {
        const errorCode = errorCodeObj.valueOf();
        return errorCode;
      }
    }
  }
  return null;
};

export const handleTabInputElemMobile = (
  evt: KeyboardEvent<HTMLInputElement>,
  callback: () => void
): void => {
  // from https://stackoverflow.com/a/11160055

  if (evt.key === 'Tab') {
    evt.preventDefault();
    const element = evt.currentTarget;
    element.setAttribute('readonly', 'readonly');
    element.setAttribute('disabled', 'true');
    // wait until the attributes are updated
    setTimeout(() => {
      element.blur(); // close keyboard
      element.removeAttribute('readonly');
      element.removeAttribute('disabled');
      callback();
    }, 100);
  }
};
