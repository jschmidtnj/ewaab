import { Resolver, Query, ArgsType, Field, Args, Ctx } from 'type-graphql';
import { elasticClient } from '../elastic/init';
import { messageIndexName } from '../elastic/settings';
import { Matches, IsOptional } from 'class-validator';
import { uuidRegex } from '../shared/variables';
import esb from 'elastic-builder';
import { MessageSortOption, SearchMessage, SearchMessagesResult } from '../schema/users/message.entity';
import { verifyLoggedIn } from '../auth/checkAuth';
import { GraphQLContext } from '../utils/context';
import { PaginationArgs } from '../schema/utils/pagination';

@ArgsType()
export class MessagesArgs extends PaginationArgs {
  // TODO - eventually support group messaging
  @Field(_type => [String], { description: 'participant' })
  @Matches(uuidRegex, {
    message: 'invalid user id provided, must be uuid v4'
  })
  participant: string;

  @Field(_type => String, { description: 'search query', nullable: true })
  @IsOptional()
  query?: string;

  @Field(_type => MessageSortOption, { description: 'sort by this field', nullable: true })
  @IsOptional()
  sortBy?: MessageSortOption;

  @Field(_type => Boolean, { description: 'sort direction', nullable: true, defaultValue: true })
  ascending: boolean;
}

export const searchMessages = async (ctx: GraphQLContext, args: MessagesArgs): Promise<SearchMessagesResult> => {
  if (args.participant === ctx.auth!.id) {
    throw new Error('user cannot message themselves');
  }

  const mustShouldParams: esb.Query[] = [];
  if (args.query) {
    args.query = args.query.toLowerCase();
    mustShouldParams.push(esb.matchQuery('content', args.query).fuzziness('AUTO'));
  }

  const filterShouldParams: esb.Query[] = [
    esb.boolQuery()
      .should([
        esb.termQuery('publisher', ctx.auth!.id),
        esb.termQuery('group', args.participant),
      ]),
    esb.boolQuery()
      .should([
        esb.termQuery('publisher', args.participant),
        esb.termQuery('group', ctx.auth!.id),
      ]),
  ];

  let requestBody = esb.requestBodySearch().query(
    esb.boolQuery()
      .must(
        esb.boolQuery()
          .should(mustShouldParams)
      )
      .filter(
        esb.boolQuery()
          .should(filterShouldParams)
      )
  );
  if (args.sortBy) {
    requestBody = requestBody.sort(esb.sort(args.sortBy,
      args.ascending ? 'asc' : 'desc'));
  }
  requestBody = requestBody.from(args.page).size(args.perpage);

  const elasticMessageData = await elasticClient.search({
    index: messageIndexName,
    body: requestBody.toJSON()
  });
  const results: SearchMessage[] = [];
  for (const hit of elasticMessageData.body.hits.hits) {
    const currentMessage: SearchMessage = {
      ...hit._source as SearchMessage,
      id: hit._id as string,
    };
    results.push(currentMessage);
  }
  return {
    results,
    count: elasticMessageData.body.hits.total.value
  };
};

@Resolver()
class MessagesResolver {
  @Query(_returns => SearchMessagesResult)
  async messages(@Args() args: MessagesArgs, @Ctx() ctx: GraphQLContext): Promise<SearchMessagesResult> {
    if (!verifyLoggedIn(ctx)) {
      throw new Error('user not logged in to view messages');
    }
    return await searchMessages(ctx, args);
  }
}

export default MessagesResolver;
