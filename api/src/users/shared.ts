import { getRepository } from 'typeorm';
import User from '../schema/users/user.entity';

export const accountExistsEmail = async (email: string): Promise<boolean> => {
  const UserModel = getRepository(User);
  return await UserModel.count({
    email,
  }) !== 0;
};

export const accountExistsUsername = async (username: string): Promise<boolean> => {
  const UserModel = getRepository(User);
  return await UserModel.count({
    username,
  }) !== 0;
};
