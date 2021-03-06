import { ApolloError } from '@apollo/react-hooks';

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
