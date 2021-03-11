import { Resolver, ArgsType, Field, Args, Mutation, Ctx } from 'type-graphql';
import { MinLength, IsOptional, Matches } from 'class-validator';
import { getRepository } from 'typeorm';
import { elasticClient } from '../elastic/init';
import { messageIndexName } from '../elastic/settings';
import { strMinLen, uuidRegex } from '../shared/variables';
import { verifyLoggedIn } from '../auth/checkAuth';
import { GraphQLContext } from '../utils/context';
import Message from '../schema/users/message.entity';
import { ApolloError } from 'apollo-server-express';
import statusCodes from 'http-status-codes';
import { QueryPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { UserType } from '../schema/users/user.entity';
import { removeKeys } from '../utils/misc';
import { connectionName } from '../db/connect';

@ArgsType()
class UpdateMessageArgs {
  @Field(_type => String, { description: 'post id' })
  @Matches(uuidRegex, {
    message: 'invalid message id provided, must be uuid v4'
  })
  id: string;

  @Field(_type => String, { description: 'message content', nullable: true })
  @IsOptional()
  @MinLength(strMinLen, {
    message: `message content must contain at least ${strMinLen} characters`
  })
  content?: string;
}

@Resolver()
class UpdateMessageResolver {
  @Mutation(_returns => String)
  async updateMessage(@Args() args: UpdateMessageArgs, @Ctx() ctx: GraphQLContext): Promise<string> {
    if (!verifyLoggedIn(ctx) || !ctx.auth) {
      throw new Error('user not logged in');
    }
    if (!Object.values(removeKeys(args, ['id'])).some(elem => elem !== undefined)) {
      throw new ApolloError('no updates found', `${statusCodes.BAD_REQUEST}`);
    }
    const MessageModel = getRepository(Message, connectionName);
    const messageData = await MessageModel.findOne(args.id, {
      select: ['id', 'publisher']
    });
    if (!messageData) {
      throw new Error(`cannot find message with id ${args.id}`);
    }

    if (ctx.auth.type !== UserType.admin) {
      if (messageData.publisher !== ctx.auth.id) {
        throw new Error(`user ${ctx.auth.id} is not publisher of post ${args.id}`);
      }
    }

    const messageUpdateData: QueryPartialEntity<Message> = {};
    if (args.content !== undefined) {
      messageUpdateData.content = args.content;
    }
    const now = new Date().getTime();
    messageUpdateData.updated = now;

    await MessageModel.update(args.id, messageUpdateData);
    await elasticClient.update({
      id: args.id,
      index: messageIndexName,
      body: {
        doc: messageUpdateData
      }
    });

    return `updated message ${args.id}`;
  }
}

export default UpdateMessageResolver;
