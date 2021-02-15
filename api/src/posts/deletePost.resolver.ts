import { verifyLoggedIn } from '../auth/checkAuth';
import { GraphQLContext } from '../utils/context';
import { Resolver, ArgsType, Field, Args, Ctx, Mutation } from 'type-graphql';
import { getRepository } from 'typeorm';
import Post from '../schema/posts/post.entity';
import { elasticClient } from '../elastic/init';
import { postIndexName } from '../elastic/settings';
import { UserType } from '../shared/variables';

@ArgsType()
class DeleteArgs {
  @Field(_type => String, { description: 'post id' })
  id: string;
}

@Resolver()
class DeletePostResolver {
  @Mutation(_returns => String)
  async deletePost(@Args() { id }: DeleteArgs, @Ctx() ctx: GraphQLContext): Promise<string> {
    if (!verifyLoggedIn(ctx) || !ctx.auth) {
      throw new Error('cannot find auth data');
    }
    const PostModel = getRepository(Post);
    if (ctx.auth.type !== UserType.admin) {
      const postData = await PostModel.findOne(id, {
        select: ['id', 'publisher']
      });
      if (!postData) {
        throw new Error('no post found');
      }
      if (postData.publisher !== ctx.auth.id) {
        throw new Error(`user ${ctx.auth.id} is not publisher of post ${id}`);
      }
    }
    await elasticClient.delete({
      id,
      index: postIndexName
    });
    await PostModel.delete(id);
    return `deleted post ${id}`;
  }
}

export default DeletePostResolver;
