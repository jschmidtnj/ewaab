/* eslint-disable @typescript-eslint/ban-types */

import { getLogger } from 'log4js';
import { elasticClient } from './init';
import { WriteType } from './writeType';

const logger = getLogger();

export interface SaveElasticElement {
  id: string;
  data?: object;
  action: WriteType;
  index: string;
}

export const bulkWriteToElastic = async (elements: SaveElasticElement[]): Promise<void> => {
  let writeBody: object[] = [];
  for (const element of elements) {
    if (element.action === WriteType.add) {
      if (!element.data) {
        throw new Error('no data provided for elastic add request');
      }
      writeBody.push([{
        index: {
          _index: element.index,
          _id: element.id
        }
      }, element.data]);
    } else if (element.action === WriteType.update) {
      if (!element.data) {
        throw new Error('no data provided for elastic update request');
      }
      writeBody.push([{
        update: {
          _index: element.index,
          _id: element.id
        }
      }, element.data]);
    } else if (element.action === WriteType.delete) {
      writeBody.push([{
        delete: {
          _index: element.index,
          _id: element.id
        }
      }]);
    } else {
      throw new Error(`update type ${element.action} is not supported for elastic bulk update`);
    }
  }
  writeBody = writeBody.flat();
  logger.info('start bulk write elastic');
  if (writeBody.length > 0) {
    await elasticClient.bulk({
      refresh: true,
      body: writeBody
    });
  }
  logger.info('end write elastic');
};
