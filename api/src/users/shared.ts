import { getRepository } from 'typeorm';
import User from '../schema/users/user.entity';

export const getUser = async (username: string): Promise<User> => {
  const UserModel = getRepository(User);
  const user = await UserModel.findOne({
    username
  });
  if (!user) {
    throw new Error(`cannot find user with username ${username}`);
  }
  return user;
};

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
