import { createConnection } from 'typeorm';
import exitHook from 'exit-hook';
import { getLogger } from 'log4js';
import { join } from 'path';

const logger = getLogger();

export const initializeDB = async (dbConnectionURI: string): Promise<string> => {
  if (dbConnectionURI.length === 0) {
    throw new Error('cannot find database uri');
  }
  const connection = await createConnection({
    url: dbConnectionURI,
    type: 'postgres',
    entities: [join(__dirname, '../**/*.entity.{ts,js}')],
    synchronize: true
  });
  exitHook(() => {
    logger.info('close database');
    connection.close();
  });
  return `database client connected to ${connection.name}`;
};
