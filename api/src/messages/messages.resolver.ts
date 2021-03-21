import { Resolver, Query, ArgsType, Field, Args, Ctx, ResolverFilterData, Subscription, Root } from 'type-graphql';
import { elasticClient } from '../elastic/init';
import { messageIndexName } from '../elastic/settings';
import { Matches, IsOptional } from 'class-validator';
import { uuidRegex } from '../shared/variables';
import esb from 'elastic-builder';
import Message, { MessageSortOption, BaseSearchMessage, SearchMessagesResult } from '../schema/users/message.entity';
import { checkMessageGroupAccess } from '../auth/checkAuth';
import { GraphQLContext, SubscriptionContext } from '../utils/context';
import { PaginationArgs } from '../schema/utils/pagination';
import { messagesTopic } from '../utils/variables';

@ArgsType()
export class SearchMessagesArgs extends PaginationArgs {
  @Field(_type => String, { description: 'group id' })
  @Matches(uuidRegex, {
    message: 'invalid group id provided, must be uuid v4'
  })
  group: string;

  @Field(_type => String, { description: 'search query', nullable: true })
  @IsOptional()
  query?: string;

  @Field(_type => MessageSortOption, { description: 'sort by this field', nullable: true })
  @IsOptional()
  sortBy?: MessageSortOption;

  @Field(_type => Boolean, { description: 'sort direction', nullable: true, defaultValue: true })
  ascending: boolean;
}

export const searchMessages = async (args: SearchMessagesArgs): Promise<SearchMessagesResult> => {
  const mustParams: esb.Query[] = [];
  if (args.query) {
    args.query = args.query.toLowerCase();
    mustParams.push(esb.simpleQueryStringQuery(args.query).field('content'));
  }

  const filterShouldParams: esb.Query[] = [
    esb.termQuery('group', args.group),
  ];

  let requestBody = esb.requestBodySearch().query(
    esb.boolQuery()
      .must(mustParams)
      .filter(
        esb.boolQuery()
          .should(filterShouldParams)
      )
  );
  if (args.sortBy) {
    requestBody = requestBody.sort(esb.sort(args.sortBy,
      args.ascending ? 'asc' : 'desc'));
  }
  requestBody = requestBody.from(args.page * args.perpage).size(args.perpage);

  const elasticMessageData = await elasticClient.search({
    index: messageIndexName,
    body: requestBody.toJSON()
  });
  const results: BaseSearchMessage[] = [];
  for (const hit of elasticMessageData.body.hits.hits) {
    const currentMessage: BaseSearchMessage = {
      ...hit._source as BaseSearchMessage,
      id: hit._id as string,
    };
    results.push(currentMessage);
  }
  return {
    results,
    count: elasticMessageData.body.hits.total.value
  };
};

@ArgsType()
export class MessagesArgs {
  @Field(_type => [String], { description: 'group id' })
  @Matches(uuidRegex, {
    message: 'invalid group id provided, must be uuid v4',
    each: true
  })
  groups: string[];
}

@Resolver()
class MessagesResolver {
  @Query(_returns => SearchMessagesResult)
  async searchMessages(@Args() args: SearchMessagesArgs, @Ctx() ctx: GraphQLContext): Promise<SearchMessagesResult> {
    if (!await checkMessageGroupAccess({
      ctx,
      id: args.group
    })) {
      throw new Error(`user does not have access to group ${args.group}`);
    }
    return await searchMessages(args);
  }

  @Subscription(_returns => Message, {
    topics: messagesTopic,
    filter: ({ payload, context, args }: ResolverFilterData<Message, MessagesArgs, SubscriptionContext>): boolean => {
      return args.groups.includes(payload.group) && context.auth !== undefined && context.groups.includes(payload.group);
    },
  })
  messages(@Root() message: Message, @Args() _args: MessagesArgs): Message {
    // note - if group id is not found or user does not have access, the subscription doesn't return anything
    // no error message, but also no output
    return message;
  }
}

export default MessagesResolver;
