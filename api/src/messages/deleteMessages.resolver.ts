import { verifyLoggedIn } from '../auth/checkAuth';
import { GraphQLContext } from '../utils/context';
import { Resolver, ArgsType, Field, Args, Ctx, Mutation } from 'type-graphql';
import { getRepository } from 'typeorm';
import Message from '../schema/users/message.entity';
import { messageIndexName } from '../elastic/settings';
import { Matches } from 'class-validator';
import { uuidRegex } from '../shared/variables';
import { bulkWriteToElastic } from '../elastic/elastic';
import { WriteType } from '../elastic/writeType';

@ArgsType()
export class DeleteArgs {
  @Field(_type => String, { description: 'receiver id' })
  @Matches(uuidRegex, {
    message: 'invalid receiver id provided, must be uuid v4'
  })
  receiver: string;
}

export const deleteMessages = async (args: DeleteArgs, sender: string): Promise<void> => {
  const MessageModel = getRepository(Message);
  const messages = await MessageModel.find({
    select: ['id'],
    where: {
      sender,
      receiver: args.receiver
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
};

@Resolver()
class DeleteMessagesResolver {
  @Mutation(_returns => String)
  async deleteMessages(@Args() args: DeleteArgs, @Ctx() ctx: GraphQLContext): Promise<string> {
    if (!verifyLoggedIn(ctx) || !ctx.auth) {
      throw new Error('cannot find auth data');
    }

    await deleteMessages(args, ctx.auth.id);

    return `deleted messages with receiver ${args.receiver}`;
  }
}

export default DeleteMessagesResolver;
