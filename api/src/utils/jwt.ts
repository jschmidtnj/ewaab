import { sign, verify, SignOptions, VerifyOptions, Secret } from 'jsonwebtoken';
import { Request, Response } from 'express';
import User, { UserType } from '../schema/users/user.entity';
import { configData } from './config';
import { loginType } from '../auth/shared';
import { getRepository } from 'typeorm';
import UserCode from '../schema/users/userCode.entity';
import { connectionName } from '../db/connect';
import { promisify } from 'util';
import { setMediaCookie } from './cookies';

// eslint-disable-next-line @typescript-eslint/ban-types
export const signPromise = promisify<string | Buffer | object, Secret, SignOptions | undefined, string>(sign);
// eslint-disable-next-line @typescript-eslint/ban-types
export const verifyPromise = promisify<string, Secret, VerifyOptions | undefined, object | string>(verify);

export const verifyJWTExpiration = '3d';

export enum VerifyType {
  verify = 'verify',
  invite = 'invite',
  resetPassword = 'resetPassword'
}

export const mediaJWTExpiration = '1h';

export enum MediaAccessType {
  media = 'media'
}

export interface JWTAuthData {
  id: string;
  type: UserType;
  emailVerified: boolean;
}

export interface AuthData {
  id: string;
  type: UserType; // user type
  loginType: loginType;
  emailVerified: boolean;
}

export interface RefreshTokenData {
  id: string;
  tokenVersion: number;
  type: UserType;
}

const accessJWTExpiration = '2h';
const refreshJWTExpiration = '2h';

export const getSecret = (type: loginType): string => {
  let secret: string;
  switch (type) {
    case loginType.LOCAL:
      secret = configData.JWT_SECRET;
      break;
    default:
      throw new Error('no jwt secret found');
  }
  return secret;
};

export const getJWTIssuer = (): string => {
  const jwtIssuer = configData.JWT_ISSUER;
  if (!jwtIssuer) {
    throw new Error('no jwt issuer found');
  }
  return jwtIssuer;
};

interface GenerateJWTArgs {
  id: string;
  type: UserType;
  emailVerified: boolean;
}

export const generateJWTAccess = async (args: GenerateJWTArgs): Promise<string> => {
  const secret = getSecret(loginType.LOCAL);
  const jwtIssuer = getJWTIssuer();
  const authData: JWTAuthData = {
    id: args.id,
    type: args.type,
    emailVerified: args.emailVerified
  };
  const signOptions: SignOptions = {
    issuer: jwtIssuer,
    expiresIn: accessJWTExpiration
  };
  const token = await signPromise(authData, secret, signOptions);
  return token;
};

export interface MediaAccessTokenData {
  id: string;
  userType: UserType;
  type: MediaAccessType.media;
  media?: string;
}

interface GenerateJWTMediaArgs {
  id: string;
  type: UserType;
  media?: string;
}
export const generateJWTMediaAccess = async (args: GenerateJWTMediaArgs, expiration?: string): Promise<string> => {
  const secret = getSecret(loginType.LOCAL);
  const jwtIssuer = getJWTIssuer();
  const authData: MediaAccessTokenData = {
    id: args.id,
    userType: args.type,
    type: MediaAccessType.media,
    media: args.media
  };
  const signOptions: SignOptions = {
    issuer: jwtIssuer
  };
  if (expiration) {
    signOptions.expiresIn = expiration;
  }
  const token = await signPromise(authData, secret, signOptions);
  return token;
};

export const generateJWTRefresh = async (authData: RefreshTokenData): Promise<string> => {
  const secret = getSecret(loginType.LOCAL);
  const jwtIssuer = getJWTIssuer();
  const signOptions: SignOptions = {
    issuer: jwtIssuer,
    expiresIn: refreshJWTExpiration
  };
  return await signPromise({
    ...authData
  }, secret, signOptions);
};

export const handleRefreshToken = async (req: Request, res: Response): Promise<string> => {
  if (!req.cookies) {
    throw new Error('no cookies found');
  }
  const token = req.cookies.refreshToken as string | undefined;
  if (!token || token.length === 0) {
    throw new Error('no token provided');
  }
  const secret = getSecret(loginType.LOCAL);
  const jwtConfig: VerifyOptions = {
    algorithms: ['HS256']
  };
  const data = await verifyPromise(token, secret, jwtConfig) as RefreshTokenData;
  let generateArgs: GenerateJWTArgs;
  let tokenVersion: number;
  if (data.type === UserType.visitor) {
    const UserCodeModel = getRepository(UserCode, connectionName);
    const userCodeData = await UserCodeModel.findOne(data.id, {
      select: ['tokenVersion', 'id']
    });
    if (!userCodeData) {
      throw new Error(`cannot find user code data with id ${data.id}`);
    }
    tokenVersion = userCodeData.tokenVersion;
    generateArgs = {
      emailVerified: true,
      id: userCodeData.id,
      type: UserType.visitor
    };
  } else {
    const UserModel = getRepository(User, connectionName);
    const user = await UserModel.findOne(data.id, {
      select: ['tokenVersion', 'id', 'type', 'emailVerified']
    });
    if (!user) {
      throw new Error('user not found');
    }
    tokenVersion = user.tokenVersion;
    generateArgs = {
      emailVerified: user.emailVerified,
      id: user.id,
      type: user.type
    };
  }
  if (tokenVersion !== data.tokenVersion) {
    throw new Error('invalid token version');
  }
  setMediaCookie(res, await generateJWTMediaAccess(generateArgs, mediaJWTExpiration));
  return await generateJWTAccess(generateArgs);
};

export const decodeAuth = async (type: loginType, token: string): Promise<AuthData> => {
  const secret = getSecret(type);
  let jwtConfig: VerifyOptions;
  if (type === loginType.LOCAL) {
    jwtConfig = {
      algorithms: ['HS256']
    };
  } else {
    throw new Error('invalid type for jwt');
  }
  const jwtData = await verifyPromise(token, secret, jwtConfig);
  let data: AuthData;
  if (type === loginType.LOCAL) {
    const inputData = jwtData as JWTAuthData;
    data = {
      ...inputData,
      loginType: type,
    };
  } else {
    throw new Error('invalid type for jwt in verify');
  }
  return data;
};
