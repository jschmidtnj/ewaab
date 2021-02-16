
import { verifyAdmin, verifyLoggedIn } from '../auth/checkAuth';
import { GraphQLContext } from '../utils/context';
import { Resolver, ArgsType, Field, Args, Ctx, Mutation } from 'type-graphql';
import { IsEmail, IsOptional } from 'class-validator';
import User from '../schema/users/user.entity';
import { FindOneOptions, getRepository } from 'typeorm';
import { deleteMedia } from './media.resolver';
import { elasticClient } from '../elastic/init';
import { userIndexName } from '../elastic/settings';

@ArgsType()
class DeleteArgs {
  @Field(_type => String, { description: 'email', nullable: true })
  @IsOptional()
  @IsEmail({}, {
    message: 'invalid email provided'
  })
  email?: string;
}

@Resolver()
class DeleteResolver {
  @Mutation(_returns => String)
  async deleteAccount(@Args() { email }: DeleteArgs, @Ctx() ctx: GraphQLContext): Promise<string> {
    const isAdmin = email !== undefined;
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
    const UserModel = getRepository(User);
    let userFindRes: User | undefined;
    const findOptions: FindOneOptions<User> = {
      select: ['id']
    };
    if (!isAdmin) {
      userFindRes = await UserModel.findOne(ctx.auth.id, findOptions);
    } else {
      userFindRes = await UserModel.findOne({
        email
      }, findOptions);
    }
    if (!userFindRes) {
      throw new Error('no user found');
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
