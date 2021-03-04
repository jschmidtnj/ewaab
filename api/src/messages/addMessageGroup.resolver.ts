import { Matches } from 'class-validator';
import { Args, ArgsType, Ctx, Field, Mutation, Resolver } from 'type-graphql';
import { getRepository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { verifyLoggedIn } from '../auth/checkAuth';
import MessageGroup, { MessageGroupUser } from '../schema/users/messageGroup.entity';
import { uuidRegex } from '../shared/variables';
import { GraphQLContext } from '../utils/context';
import { arrayHash } from '../utils/misc';

@ArgsType()
class AddMessageGroupArgs {
  @Field(_type => [String], { description: 'user ids' })
  @Matches(uuidRegex, {
    message: 'invalid user id provided, must be uuid v4',
    each: true
  })
  members: string[];
}

@Resolver()
class AddMessageGroupResolver {
  @Mutation(_returns => String)
  async addMessageGroup(@Args() args: AddMessageGroupArgs, @Ctx() ctx: GraphQLContext): Promise<string> {
    if (!verifyLoggedIn(ctx) || !ctx.auth) {
      throw new Error('user not logged in');
    }

    if (args.members.includes(ctx.auth.id)) {
      throw new Error('current user id cannot be part of group member list');
    }
    args.members.push(ctx.auth!.id);
    const memberHash = arrayHash(args.members);

    const MessageGroupModel = getRepository(MessageGroup);
    if ((await MessageGroupModel.count({
      usersHash: memberHash
    })) > 0) {
      throw new Error('message group with given members already exists');
    }

    const now = new Date().getTime();
    const newMessageGroup = await MessageGroupModel.save({
      created: now,
      updated: now,
      id: uuidv4(),
      userCount: args.members.length,
      userIDs: args.members,
      usersHash: memberHash
    });

    const MessageGroupUserModel = getRepository(MessageGroupUser);
    for (const userID of args.members) {
      await MessageGroupUserModel.save({
        groupID: newMessageGroup.id,
        time: now,
        userID,
      });
    }

    return `created message group with id ${newMessageGroup.id}`;
  }
}

export default AddMessageGroupResolver;
