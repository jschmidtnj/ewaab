import { Path, ContextRequest, POST, Errors, ContextResponse } from 'typescript-rest';
import { Request, Response } from 'express';
import { handleRefreshToken } from '../utils/jwt';
import { RestReturnObj } from '../schema/utils/returnObj';

@Path('/refreshToken')
export class RefreshToken {
  @POST
  async refreshToken(@ContextRequest req: Request, @ContextResponse res: Response): Promise<RestReturnObj> {
    try {
      const accessToken = await handleRefreshToken(req, res);
      return {
        data: accessToken,
        message: 'got access token'
      };
    } catch (err) {
      const errObj = err as Error;
      throw new Errors.BadRequestError(errObj.message);
    }
  }
}
