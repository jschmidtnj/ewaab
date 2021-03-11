import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

export const sanitize = (dirty: string): string => {
  const window = new JSDOM('').window;
  const DOMPurify = createDOMPurify(window as unknown as Window);

  return DOMPurify.sanitize(dirty);
};
