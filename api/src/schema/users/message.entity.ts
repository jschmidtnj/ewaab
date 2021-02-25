import { Entity, Column, PrimaryColumn, Index } from 'typeorm';
import { ObjectType, Field, registerEnumType, Int } from 'type-graphql';
import { IsDefined } from 'class-validator';
import { BaseTimestamp } from '../utils/baseTimestamp';

export enum MessageSortOption {
  created = 'created',
  updated = 'updated',
}

registerEnumType(MessageSortOption, {
  name: 'MessageSortOption',
  description: 'message sort options',
});

@ObjectType({ description: 'message data, indexed in elasticsearch', isAbstract: true })
export class SearchMessage extends BaseTimestamp {
  @Field({ description: 'message id' })
  id?: string;

  @Field({ description: 'message content' })
  @Column({ type: 'text' })
  @IsDefined()
  content: string;

  @Field({ description: 'message publisher' })
  @Column({ type: 'uuid' })
  @Index()
  @IsDefined()
  publisher: string;

  @Field({ description: 'group message recipient' })
  @Column({ type: 'uuid' })
  @Index()
  @IsDefined()
  group: string;
}

@ObjectType({ description: 'message data search results' })
export class SearchMessagesResult {
  @Field(_type => [SearchMessage], { description: 'results' })
  results: SearchMessage[];

  @Field(_type => Int, { description: 'total message count' })
  count: number;
}

@ObjectType({ description: 'message data' })
@Entity({ name: 'messages' })
export default class Message extends SearchMessage {
  @Field({ description: 'message id' })
  @PrimaryColumn('uuid')
  id: string;
}
