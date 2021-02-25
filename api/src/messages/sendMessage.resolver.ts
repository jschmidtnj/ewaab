import { Resolver, ArgsType, Field, Args, Mutation, Ctx } from 'type-graphql';
import { MinLength, Matches } from 'class-validator';
import { getRepository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { elasticClient } from '../elastic/init';
import { messageIndexName } from '../elastic/settings';
import { strMinLen, uuidRegex } from '../shared/variables';
import { verifyLoggedIn } from '../auth/checkAuth';
import { GraphQLContext } from '../utils/context';
import { getTime } from '../shared/time';
import Message, { SearchMessage } from '../schema/users/message.entity';
import User from '../schema/users/user.entity';

@ArgsType()
class SendMessageArgs {
  @Field(_type => String, { description: 'group id' })
  @Matches(uuidRegex, {
    message: 'invalid user id provided, must be uuid v4'
  })
  group: string;

  @Field(_type => String, { description: 'message content' })
  @MinLength(strMinLen, {
    message: `message content must contain at least ${strMinLen} characters`
  })
  content: string;
}

@Resolver()
class SendMessageResolver {
  @Mutation(_returns => String)
  async sendMessage(@Args() args: SendMessageArgs, @Ctx() ctx: GraphQLContext): Promise<string> {
    if (!verifyLoggedIn(ctx) || !ctx.auth) {
      throw new Error('user not logged in');
    }

    if (args.group === ctx.auth!.id) {
      throw new Error('user cannot message themselves');
    }

    const UserModel = getRepository(User);
    if (await UserModel.count({
      id: args.group
    }) === 0) {
      throw new Error(`no user found with id ${args.group}`);
    }

    const MessageModel = getRepository(Message);
    const now = getTime();
    const searchMessage: SearchMessage = {
      content: args.content,
      created: now,
      updated: now,
      publisher: ctx.auth.id,
      group: args.group
    };

    const id = uuidv4();

    await elasticClient.index({
      id,
      index: messageIndexName,
      body: searchMessage
    });
    const newMessage = await MessageModel.save({
      ...searchMessage,
      id
    });

    return `created message ${newMessage.id}`;
  }
}

export default SendMessageResolver;
