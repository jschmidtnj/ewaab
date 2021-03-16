import { Request, Response } from 'express';
import { checkMedia, checkText, contentTypeHeader } from '../utils/misc';
import { InternalServerError, NotFoundError } from 'typescript-rest/dist/server/model/errors';
import { getMediaKey, getS3FileData, S3Data } from '../utils/aws';
import { getContext } from '../utils/context';
import { getMediaAuthenticated } from './media.resolver';
import type { VerifyOptions } from 'jsonwebtoken';
import { loginType } from '../auth/shared';
import { getSecret, MediaAccessTokenData, MediaAccessType, verifyPromise } from '../utils/jwt';
import Media from '../schema/media/media.entity';
import { mediaCookieName } from '../utils/cookies';

export const decodeMediaAuth = async (token: string): Promise<MediaAccessTokenData> => {
  const secret = getSecret(loginType.LOCAL);
  const jwtConfig: VerifyOptions = {
    algorithms: ['HS256']
  };
  const jwtData = await verifyPromise(token, secret, jwtConfig) as Record<string, any>;
  if (!('type' in jwtData)) {
    throw new Error('no type provided');
  }
  const type: MediaAccessType = jwtData.type;
  if (type !== MediaAccessType.media) {
    throw new Error(`invalid media type ${type} provided`);
  }
  return jwtData as MediaAccessTokenData;
};

export const getFile = async (args: {
  req: Request;
  res: Response;
  text?: boolean;
  download?: boolean;
  blur?: boolean;
}): Promise<void> => {
  // default query params:
  if (args.download === undefined) {
    args.download = false;
  }
  if (args.text === undefined) {
    args.text = true;
  }

  let s3FileData: S3Data;
  let fileName: string;
  try {
    const mediaID = args.req.path.split('/media/')[1];

    let mediaData: Media;
    const ctx = await getContext({
      req: args.req,
      res: args.res
    });
    if ('t' in args.req.query) {
      mediaData = await getMediaAuthenticated({
        id: mediaID
      }, ctx, await decodeMediaAuth(args.req.query['t'] as string));
    } else if (mediaCookieName in args.req.cookies) {
      mediaData = await getMediaAuthenticated({
        id: mediaID
      }, ctx, await decodeMediaAuth(args.req.cookies[mediaCookieName]));
    } else {
      mediaData = await getMediaAuthenticated({
        id: mediaID,
      }, ctx);
    }
    fileName = mediaData.name;
    const key = getMediaKey(mediaID, args.blur);
    s3FileData = await getS3FileData(key, true);
  } catch (err) {
    const errObj = err as Error;
    throw new NotFoundError(`problem getting file: ${errObj.message}`);
  }

  let resMimeType: string;
  let downloadFile: boolean;
  if (args.download || !s3FileData.mime) {
    // download
    resMimeType = s3FileData.mime ? s3FileData.mime : 'application/octet-stream';
    downloadFile = true;
  } else if (checkText(s3FileData.mime)) { // don't download
    resMimeType = args.text ? 'text/plain' : s3FileData.mime;
    downloadFile = false;
  } else if (checkMedia(s3FileData.mime)) {
    // media type that can be displayed
    resMimeType = s3FileData.mime;
    downloadFile = false;
  } else {
    // binary file
    downloadFile = true;
    resMimeType = s3FileData.mime;
  }
  args.res.setHeader(contentTypeHeader, resMimeType);
  if (downloadFile) {
    args.res.setHeader('content-disposition', `attachment; filename=${fileName}`);
  }
  return new Promise<void>((resolve, reject) => {
    s3FileData.file.on('end', () => resolve());
    s3FileData.file.on('error', _err => {
      reject(new InternalServerError('problem writing file'));
    });
    s3FileData.file.pipe(args.res);
  });
};
