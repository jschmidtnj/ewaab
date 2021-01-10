import { Path, GET, QueryParam, ContextRequest, ContextResponse } from 'typescript-rest';
import { Request, Response } from 'express';
import { getFile } from './files';

@Path('/media')
class Media {
  @GET
  @Path('/*')
  async rawFile(@ContextRequest req: Request, @ContextResponse res: Response,
    @QueryParam('text') text?: boolean,
    @QueryParam('download') download?: boolean,
    @QueryParam('blur') blur?: boolean): Promise<void> {

    await getFile({
      req,
      res,
      download,
      text,
      blur
    });
  }
}

export default Media;
