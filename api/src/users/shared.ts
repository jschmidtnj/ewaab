import { getRepository } from 'typeorm';
import User from '../schema/users/user.entity';
import { connectionName } from '../db/connect';

export const accountExistsEmail = async (email: string): Promise<boolean> => {
  const UserModel = getRepository(User, connectionName);
  return await UserModel.count({
    email,
  }) !== 0;
};

export const accountExistsUsername = async (username: string): Promise<boolean> => {
  const UserModel = getRepository(User, connectionName);
  return await UserModel.count({
    username,
  }) !== 0;
};
