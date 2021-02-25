import { verifyLoggedIn } from '../auth/checkAuth';
import { GraphQLContext } from '../utils/context';
import { Resolver, ArgsType, Field, Args, Ctx, Mutation } from 'type-graphql';
import { Any, getRepository } from 'typeorm';
import Message from '../schema/users/message.entity';
import { messageIndexName } from '../elastic/settings';
import { Matches } from 'class-validator';
import { uuidRegex } from '../shared/variables';
import { bulkWriteToElastic } from '../elastic/elastic';
import { WriteType } from '../elastic/writeType';
import MessageGroup from '../schema/users/messageGroup.entity';

@ArgsType()
export class DeleteArgs {
  @Field(_type => String, { description: 'group id' })
  @Matches(uuidRegex, {
    message: 'invalid group id provided, must be uuid v4'
  })
  group: string;
}

export const deleteMessages = async (args: DeleteArgs, sender?: string): Promise<void> => {
  const MessageModel = getRepository(Message);
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
  if (!sender) {
    const MessageGroupModel = getRepository(MessageGroup);
    const messageGroup = await MessageGroupModel.findOne(args.group, {
      select: ['id', 'userCount']
    });
    if (!messageGroup) {
      throw new Error('cannot find message group');
    }
    if (messageGroup.userCount === 2) {
      await MessageGroupModel.delete(args.group);
    }
  }
};

@Resolver()
class DeleteMessagesResolver {
  @Mutation(_returns => String)
  async deleteMessages(@Args() args: DeleteArgs, @Ctx() ctx: GraphQLContext): Promise<string> {
    if (!verifyLoggedIn(ctx) || !ctx.auth) {
      throw new Error('cannot find auth data');
    }
    const MessageGroupModel = getRepository(MessageGroup);
    if ((await MessageGroupModel.count({
      where: {
        userIDs: Any([ctx.auth!.id])
      }
    })) === 0) {
      throw new Error(`user not part of group ${args.group}`);
    }

    await deleteMessages(args, ctx.auth.id);

    return `deleted user messages in group ${args.group}`;
  }

  async deleteGroup(@Args() args: DeleteArgs, @Ctx() ctx: GraphQLContext): Promise<string> {
    if (!verifyLoggedIn(ctx) || !ctx.auth) {
      throw new Error('cannot find auth data');
    }
    const MessageGroupModel = getRepository(MessageGroup);
    if ((await MessageGroupModel.count({
      where: {
        userIDs: Any([ctx.auth!.id])
      }
    })) === 0) {
      throw new Error(`user not part of group ${args.group}`);
    }

    await deleteMessages(args);

    return `deleted group ${args.group}`;
  }
}

export default DeleteMessagesResolver;
