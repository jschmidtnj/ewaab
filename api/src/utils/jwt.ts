import { sign, verify, SignOptions, VerifyOptions } from 'jsonwebtoken';
import { Request } from 'express';
import User, { UserType } from '../schema/users/user.entity';
import { configData } from './config';
import { loginType } from '../auth/shared';
import { getRepository } from 'typeorm';
import UserCode from '../schema/users/userCode.entity';
import { connectionName } from '../db/connect';

export const verifyJWTExpiration = '1h';

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

export const generateJWTAccess = (args: GenerateJWTArgs): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    let secret: string;
    let jwtIssuer: string;
    try {
      secret = getSecret(loginType.LOCAL);
      jwtIssuer = getJWTIssuer();
    } catch (err) {
      reject(err as Error);
      return;
    }
    const authData: JWTAuthData = {
      id: args.id,
      type: args.type,
      emailVerified: args.emailVerified
    };
    const signOptions: SignOptions = {
      issuer: jwtIssuer,
      expiresIn: accessJWTExpiration
    };
    sign(authData, secret, signOptions, (err, token) => {
      if (err) {
        reject(err as Error);
      } else {
        resolve(token as string);
      }
    });
  });
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

export const generateJWTMediaAccess = (args: GenerateJWTMediaArgs, expiration?: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    let secret: string;
    let jwtIssuer: string;
    try {
      secret = getSecret(loginType.LOCAL);
      jwtIssuer = getJWTIssuer();
    } catch (err) {
      reject(err as Error);
      return;
    }
    const authData: MediaAccessTokenData = {
      id: args.id,
      userType: args.type,
      type: MediaAccessType.media,
      media: args.media
    };
    const signOptions: SignOptions = {
      issuer: jwtIssuer,
      expiresIn: expiration
    };
    sign(authData, secret, signOptions, (err, token) => {
      if (err) {
        reject(err as Error);
      } else {
        resolve(token as string);
      }
    });
  });
};

export const generateJWTRefresh = (authData: RefreshTokenData): Promise<string> => {
  return new Promise((resolve, reject) => {
    let secret: string;
    let jwtIssuer: string;
    try {
      secret = getSecret(loginType.LOCAL);
      jwtIssuer = getJWTIssuer();
    } catch (err) {
      reject(err as Error);
      return;
    }
    const signOptions: SignOptions = {
      issuer: jwtIssuer,
      expiresIn: refreshJWTExpiration
    };
    sign({
      ...authData
    }, secret, signOptions, (err, token) => {
      if (err) {
        reject(err as Error);
      } else {
        resolve(token as string);
      }
    });
  });
};

export const handleRefreshToken = (req: Request): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!req.cookies) {
      throw new Error('no cookies found');
    }
    const token = req.cookies.refreshToken as string | undefined;
    if (!token || token.length === 0) {
      throw new Error('no token provided');
    }
    let secret: string;
    try {
      secret = getSecret(loginType.LOCAL);
    } catch (err) {
      reject(err as Error);
      return;
    }
    const jwtConfig: VerifyOptions = {
      algorithms: ['HS256']
    };
    verify(token, secret, jwtConfig, async (err, res) => {
      try {
        if (err) {
          throw err as Error;
        }
        const data = res as RefreshTokenData;
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
        resolve(await generateJWTAccess(generateArgs));
      } catch (err) {
        const errObj = err as Error;
        reject(errObj);
      }
    });
  });
};

export const decodeAuth = (type: loginType, token: string): Promise<AuthData> => {
  return new Promise((resolve, reject) => {
    try {
      const secret = getSecret(type);
      let jwtConfig: VerifyOptions;
      if (type === loginType.LOCAL) {
        jwtConfig = {
          algorithms: ['HS256']
        };
      } else {
        throw new Error('invalid type for jwt');
      }
      verify(token, secret, jwtConfig, async (err, res: any) => {
        try {
          if (err) {
            throw err as Error;
          }
          let data: AuthData;
          if (type === loginType.LOCAL) {
            const inputData = res as JWTAuthData;
            data = {
              ...inputData,
              loginType: type,
            };
          } else {
            throw new Error('invalid type for jwt in verify');
          }
          resolve(data);
        } catch (err) {
          const errObj = err as Error;
          reject(errObj);
        }
      });
    } catch (err) {
      const errObj = err as Error;
      reject(errObj);
    }
  });
};
