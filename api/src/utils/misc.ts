import internal from 'stream';
import { BinaryLike, createHash } from 'crypto';

export const streamToString = (stream: internal.Readable): Promise<string> => {
  const chunks: Uint8Array[] = [];
  return new Promise<string>((resolve, reject) => {
    stream.on('data', chunk => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });
};

export const imageMime = 'image/';

const mediaMimes: string[] = [imageMime, 'video/', 'audio/'];

export const checkMedia = (mime: string): boolean => {
  return mediaMimes.some(start => mime.startsWith(start));
};

export const contentTypeHeader = 'content-type';

const textMimes = new Set<string>(['application/json', 'application/ld+json']);

export const checkText = (mime: string): boolean => {
  return mime.startsWith('text/') || textMimes.has(mime);
};

const textFileMimes = new Set<string>(['application/pdf', 'application/msword']);

export const checkTextFile = (mime: string): boolean => {
  return checkText(mime) || textFileMimes.has(mime);
};

export const arrayHash = (elements: BinaryLike[]): string => {
  const hash = createHash('md5');
  for (const element in elements) {
    hash.update(element);
  }
  return hash.digest('hex');
};

export const removeKeys = (elem: unknown, keys: string[]): Record<string, unknown> => {
  const removed: Record<string, undefined> = {};
  for (const key of keys) {
    removed[key] = undefined;
  }
  return Object.assign({}, elem, removed);
};
