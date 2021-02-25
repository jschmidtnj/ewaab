import { verifyLoggedIn } from '../auth/checkAuth';
import { Resolver, Ctx, Query, ResolverInterface, FieldResolver, Root, Args } from 'type-graphql';
import { GraphQLContext } from '../utils/context';
import User, { UserType } from '../schema/users/user.entity';
import { getRepository } from 'typeorm';
import { sign } from 'jsonwebtoken';
import { SignOptions } from 'jsonwebtoken';
import { loginType } from '../auth/shared';
import { getSecret, getJWTIssuer, mediaJWTExpiration, MediaAccessType } from '../utils/jwt';
import MessageGroup from '../schema/users/messageGroup.entity';
import { getMessageGroups, MessageGroupsArgs } from '../messages/messageGroups.resolver';

export interface MediaAccessTokenData {
  id: string;
  userType: UserType;
  type: MediaAccessType.media;
}

const generateJWTMediaAccess = (user: User): Promise<string> => {
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
      id: user.id,
      userType: user.type,
      type: MediaAccessType.media
    };
    const signOptions: SignOptions = {
      issuer: jwtIssuer,
      expiresIn: mediaJWTExpiration
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

@Resolver(_of => User)
class UserResolvers implements ResolverInterface<User> {
  @Query(_type => User, { description: 'user data' })
  async user(@Ctx() ctx: GraphQLContext): Promise<User> {
    if (!verifyLoggedIn(ctx)) {
      throw new Error('user not logged in');
    }
    if (!ctx.auth) {
      throw new Error('cannot find auth');
    }
    const UserModel = getRepository(User);
    const user = await UserModel.findOne(ctx.auth.id);
    if (!user) {
      throw new Error(`cannot find user with id ${ctx.auth.id}`);
    }
    return user;
  }

  @FieldResolver()
  async mediaAuth(@Root() user: User): Promise<string> {
    return await generateJWTMediaAccess(user);
  }

  @FieldResolver()
  async activeMessageGroups(@Root() user: User, @Args() args: MessageGroupsArgs): Promise<MessageGroup[]> {
    return await getMessageGroups(args, user.id);
  }
}

export default UserResolvers;
