import { Response } from 'express';
import { configData } from './config';
import { isProduction } from './mode';

const refreshCookieName = 'refreshToken';
const refreshCookiePath = '/refreshToken';
export const mediaCookieName = 'media';
const mediaCookiePath = '/media';

const sameSite = configData.USE_SECURE ? 'strict' : 'lax';

export const setRefreshCookie = (res: Response, refreshToken: string): void => {
  res.cookie(refreshCookieName, refreshToken, {
    httpOnly: true,
    path: refreshCookiePath,
    secure: isProduction(),
    sameSite
  });
};

export const setMediaCookie = (res: Response, mediaToken: string): void => {
  res.cookie(mediaCookieName, mediaToken, {
    httpOnly: true,
    path: mediaCookiePath,
    secure: isProduction(),
    sameSite
  });
};

export const clearCookies = (res: Response): void => {
  res.clearCookie(refreshCookieName);
  res.clearCookie(mediaCookieName);
};
