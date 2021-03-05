import { verifyLoggedIn } from '../auth/checkAuth';
import { GraphQLContext } from '../utils/context';
import { Resolver, ArgsType, Field, Args, Ctx, Mutation } from 'type-graphql';
import { getRepository } from 'typeorm';
import Message from '../schema/users/message.entity';
import { elasticClient } from '../elastic/init';
import { messageIndexName } from '../elastic/settings';
import { UserType } from '../schema/users/user.entity';
import { Matches } from 'class-validator';
import { uuidRegex } from '../shared/variables';
import { deleteReactions } from '../reactions/deleteReaction.resolver';
import { ReactionParentType } from '../schema/reactions/reaction.entity';

@ArgsType()
class DeleteArgs {
  @Field(_type => String, { description: 'message id' })
  @Matches(uuidRegex, {
    message: 'invalid message id provided, must be uuid v4'
  })
  id: string;
}

@Resolver()
class DeleteMessageResolver {
  @Mutation(_returns => String)
  async deleteMessage(@Args() { id }: DeleteArgs, @Ctx() ctx: GraphQLContext): Promise<string> {
    if (!verifyLoggedIn(ctx) || !ctx.auth) {
      throw new Error('cannot find auth data');
    }
    const MessageModel = getRepository(Message);
    const messageData = await MessageModel.findOne(id, {
      select: ['id', 'publisher']
    });
    if (!messageData) {
      throw new Error('no message found');
    }

    await deleteReactions(id, ReactionParentType.message);

    if (ctx.auth.type !== UserType.admin) {
      if (messageData.publisher !== ctx.auth.id) {
        throw new Error(`user ${ctx.auth.id} is not publisher of post ${id}`);
      }
    }
    await elasticClient.delete({
      id,
      index: messageIndexName
    });
    await MessageModel.delete(id);

    return `deleted post ${id}`;
  }
}

export default DeleteMessageResolver;
