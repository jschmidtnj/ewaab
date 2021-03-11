import { checkMessageGroupAccess } from '../auth/checkAuth';
import { GraphQLContext } from '../utils/context';
import { Resolver, ArgsType, Field, Args, Ctx, Mutation } from 'type-graphql';
import { getRepository } from 'typeorm';
import Message from '../schema/users/message.entity';
import { messageIndexName } from '../elastic/settings';
import { Matches } from 'class-validator';
import { uuidRegex } from '../shared/variables';
import { bulkWriteToElastic } from '../elastic/elastic';
import { WriteType } from '../elastic/writeType';
import MessageGroup, { MessageGroupUser } from '../schema/users/messageGroup.entity';
import { arrayHash } from '../utils/misc';
import { connectionName } from '../db/connect';

@ArgsType()
export class DeleteArgs {
  @Field(_type => String, { description: 'group id' })
  @Matches(uuidRegex, {
    message: 'invalid group id provided, must be uuid v4'
  })
  group: string;
}

export const deleteMessages = async (args: DeleteArgs, sender?: string): Promise<void> => {
  const MessageModel = getRepository(Message, connectionName);
  const messages = await MessageModel.find({
    select: ['id'],
    where: {
      sender,
      group: args.group
    }
  });
  if (messages.length === 0) {
    return;
  }

  await bulkWriteToElastic(messages.map(messageData => ({
    action: WriteType.delete,
    id: messageData.id,
    index: messageIndexName
  })));

  for (const messageData of messages) {
    await MessageModel.delete(messageData.id);
  }

  const MessageGroupModel = getRepository(MessageGroup, connectionName);

  // if there's no sender, the whole group gets deleted
  let deleteMessageGroup = !sender;

  if (sender) {
    const messageGroup = await MessageGroupModel.findOne(args.group, {
      select: ['id', 'userCount']
    });
    if (!messageGroup) {
      throw new Error('cannot find message group');
    }
    if (messageGroup.userCount === 2) {
      deleteMessageGroup = true;
    } else {
      const userIDs = messageGroup.userIDs.filter(id => id !== sender);
      const usersHash = arrayHash(userIDs);
      await MessageGroupModel.update({
        id: args.group
      }, {
        userIDs,
        usersHash,
        updated: new Date().getTime(),
        userCount: messageGroup.userCount - 1
      });
    }
  }

  if (deleteMessageGroup) {
    const MessageGroupUserModel = getRepository(MessageGroupUser, connectionName);
    for (const messageGroupUserData of await MessageGroupUserModel.find({
      where: {
        groupID: args.group
      },
      select: ['id']
    })) {
      await MessageGroupUserModel.delete(messageGroupUserData.id);
    }
    await MessageGroupModel.delete(args.group);
  }
};

@Resolver()
class DeleteMessagesResolver {
  @Mutation(_returns => String)
  async deleteMessages(@Args() args: DeleteArgs, @Ctx() ctx: GraphQLContext): Promise<string> {
    if (!await checkMessageGroupAccess({
      ctx,
      id: args.group
    })) {
      throw new Error(`user does not have access to group ${args.group}`);
    }

    await deleteMessages(args, ctx.auth!.id);

    return `left message group ${args.group}`;
  }

  async deleteGroup(@Args() args: DeleteArgs, @Ctx() ctx: GraphQLContext): Promise<string> {
    if (!await checkMessageGroupAccess({
      ctx,
      id: args.group
    })) {
      throw new Error(`user does not have access to group ${args.group}`);
    }

    await deleteMessages(args);

    return `deleted group ${args.group}`;
  }
}

export default DeleteMessagesResolver;
