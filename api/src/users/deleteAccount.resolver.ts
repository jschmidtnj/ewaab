
import { verifyAdmin, verifyLoggedIn } from '../auth/checkAuth';
import { GraphQLContext } from '../utils/context';
import { Resolver, ArgsType, Field, Args, Ctx, Mutation } from 'type-graphql';
import { IsOptional, Matches, ValidateIf } from 'class-validator';
import User from '../schema/users/user.entity';
import { FindOneOptions, getRepository } from 'typeorm';
import { deleteMedia } from './media.resolver';
import { elasticClient } from '../elastic/init';
import { userIndexName } from '../elastic/settings';
import { deleteMessages } from '../messages/deleteMessages.resolver';
import MessageGroup, { MessageGroupUser } from '../schema/users/messageGroup.entity';
import { defaultDBCache } from '../utils/variables';
import { connectionName } from '../db/connect';
import { validUsername } from '../shared/variables';

@ArgsType()
class DeleteArgs {
  @Field(_type => String, { description: 'username', nullable: true })
  @IsOptional()
  @ValidateIf((_obj, val?: string) => val !== undefined && val.length > 0)
  @Matches(validUsername, {
    message: 'invalid username provided'
  })
  username?: string;
}

@Resolver()
class DeleteResolver {
  @Mutation(_returns => String)
  async deleteAccount(@Args() { username }: DeleteArgs, @Ctx() ctx: GraphQLContext): Promise<string> {
    const isAdmin = username !== undefined;
    if (!ctx.auth) {
      throw new Error('cannot find auth data');
    }
    if (isAdmin) {
      if (!verifyAdmin(ctx)) {
        throw new Error('user not admin');
      }
    } else {
      if (!verifyLoggedIn(ctx)) {
        throw new Error('user not logged in');
      }
    }
    const UserModel = getRepository(User, connectionName);
    let userFindRes: User | undefined;
    const findOptions: FindOneOptions<User> = {
      select: ['id']
    };
    if (!isAdmin) {
      userFindRes = await UserModel.findOne(ctx.auth.id, findOptions);
    } else {
      userFindRes = await UserModel.findOne({
        username
      }, findOptions);
    }
    if (!userFindRes) {
      throw new Error('no user found');
    }

    const MessageGroupModel = getRepository(MessageGroup, connectionName);
    const messageGroups = await MessageGroupModel.createQueryBuilder('messageGroup')
      .where('messageGroup.userIDs @> :userIDs').setParameters({
        userIDs: [userFindRes.id]
      }).select(['id', '"userCount"']).cache(defaultDBCache).getMany();
    for (const messageGroup of messageGroups) {
      if (messageGroup.userCount === 2) {
        await deleteMessages({
          group: messageGroup.id
        }, userFindRes.id);
      }
    }

    const MessageGroupUserModel = getRepository(MessageGroupUser, connectionName);
    for (const messageGroupUserData of await MessageGroupUserModel.find({
      where: {
        userID: userFindRes.id
      },
      select: ['id']
    })) {
      await MessageGroupUserModel.delete(messageGroupUserData.id);
    }

    const userData = userFindRes as User;
    if (userData.avatar) {
      await deleteMedia(userData.avatar);
    }
    if (userData.resume) {
      await deleteMedia(userData.resume);
    }
    await elasticClient.delete({
      id: userData.id,
      index: userIndexName
    });
    await UserModel.delete(userData.id);
    return `deleted user ${userData.id}`;
  }
}

export default DeleteResolver;
