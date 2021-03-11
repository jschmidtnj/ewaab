import { FieldResolver, Int, Resolver, ResolverInterface, Root } from 'type-graphql';
import { getRepository } from 'typeorm';
import { elasticClient } from '../elastic/init';
import Message from '../schema/users/message.entity';
import { MessageGroupUser } from '../schema/users/messageGroup.entity';
import esb from 'elastic-builder';
import { messageIndexName } from '../elastic/settings';
import { connectionName } from '../db/connect';

@Resolver(_of => MessageGroupUser)
class MessageGroupUserResolver implements ResolverInterface<MessageGroupUser> {
  @FieldResolver(_typpe => Int, { nullable: true })
  async unreadCount(@Root() messageUserGroup: MessageGroupUser): Promise<number | undefined> {
    const MessageModel = getRepository(Message, connectionName);
    if (!messageUserGroup.messageID) {
      return undefined;
    }
    const lastReadData = await MessageModel.findOne(messageUserGroup.messageID, {
      select: ['created']
    });
    if (!lastReadData) {
      // message was deleted
      const MessageGroupUserModel = getRepository(MessageGroupUser, connectionName);
      await MessageGroupUserModel.update({
        id: messageUserGroup.id
      }, {
        messageID: null
      });
      return 0;
    }
    const requestBody = esb.requestBodySearch().aggregation(
      esb.filtersAggregation('count').filter('count', esb.boolQuery().filter([
        esb.termQuery('group', messageUserGroup.groupID),
        esb.rangeQuery('created').gte(lastReadData.created)
      ]))
    );

    const elasticsearchMessageData = await elasticClient.search({
      index: messageIndexName,
      body: requestBody.toJSON()
    });

    const count = elasticsearchMessageData.body.aggregations.count.buckets.count.doc_count;
    return count;
  }
}

export default MessageGroupUserResolver;
