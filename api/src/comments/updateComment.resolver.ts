import { Resolver, ArgsType, Field, Args, Mutation, Ctx } from 'type-graphql';
import { MinLength, Matches } from 'class-validator';
import { getRepository } from 'typeorm';
import { elasticClient } from '../elastic/init';
import { commentIndexName } from '../elastic/settings';
import { strMinLen, uuidRegex } from '../shared/variables';
import { verifyLoggedIn } from '../auth/checkAuth';
import { GraphQLContext } from '../utils/context';
import Comment, { BaseSearchComment } from '../schema/posts/comment.entity';
import { ApolloError } from 'apollo-server-express';
import statusCodes from 'http-status-codes';
import { QueryPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { UserType } from '../schema/users/user.entity';
import { removeKeys } from '../utils/misc';
import { connectionName } from '../db/connect';

@ArgsType()
class UpdateCommentArgs {
  @Field(_type => String, { description: 'post id' })
  @Matches(uuidRegex, {
    message: 'invalid comment id provided, must be uuid v4'
  })
  id: string;

  @Field(_type => String, { description: 'comment content' })
  @MinLength(strMinLen, {
    message: `comment content must contain at least ${strMinLen} characters`
  })
  content: string;
}

@Resolver()
class UpdateCommentResolver {
  @Mutation(_returns => String)
  async updateComment(@Args() args: UpdateCommentArgs, @Ctx() ctx: GraphQLContext): Promise<string> {
    if (!verifyLoggedIn(ctx) || !ctx.auth) {
      throw new Error('user not logged in');
    }
    if (!Object.values(removeKeys(args, ['id'])).some(elem => elem !== undefined)) {
      throw new ApolloError('no updates found', `${statusCodes.BAD_REQUEST}`);
    }
    const CommentModel = getRepository(Comment, connectionName);
    const commentData = await CommentModel.findOne(args.id, {
      select: ['id', 'publisher']
    });
    if (!commentData) {
      throw new Error(`cannot find comment with id ${args.id}`);
    }

    if (ctx.auth.type !== UserType.admin) {
      if (commentData.publisher !== ctx.auth.id) {
        throw new Error(`user ${ctx.auth.id} is not publisher of post ${args.id}`);
      }
    }

    const commentUpdateData: QueryPartialEntity<Comment> = {};
    const commentSearchUpdateData: QueryPartialEntity<BaseSearchComment> = {};

    commentUpdateData.content = args.content;
    commentSearchUpdateData.content = args.content;

    const now = new Date().getTime();
    commentUpdateData.updated = now;
    commentSearchUpdateData.updated = now;

    await CommentModel.update(args.id, commentUpdateData);
    await elasticClient.update({
      id: args.id,
      index: commentIndexName,
      body: {
        doc: commentSearchUpdateData
      }
    });

    return `updated comment ${args.id}`;
  }
}

export default UpdateCommentResolver;
