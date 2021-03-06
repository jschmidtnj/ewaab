import { Entity, Column, PrimaryColumn, Index } from 'typeorm';
import { ObjectType, Field, Int } from 'type-graphql';
import { IsDefined } from 'class-validator';
import { PublicUser } from './user.entity';
import { BaseTimestamp } from '../utils/baseTimestamp';

@ObjectType({ description: 'message group user data' })
@Entity({ name: 'messageGroupUser' })
export class MessageGroupUser {
  @Field({ description: 'message group read id' })
  @PrimaryColumn('uuid')
  id: string;

  @Field({ description: 'user id' })
  @Column({ type: 'uuid' })
  @Index()
  @IsDefined()
  userID: string;

  @Field({ description: 'group id' })
  @Column({ type: 'uuid' })
  @Index()
  @IsDefined()
  groupID: string;

  @Field(_type => String, { description: 'message id', nullable: true })
  @Column({ type: 'uuid', nullable: true })
  messageID?: string | null;

  @Field({ description: 'date read' })
  @Column({ type: 'bigint' })
  @IsDefined()
  time: number;

  @Field(_type => Int, { description: 'unread message count', nullable: true })
  unreadCount?: number;
}

@ObjectType({ description: 'message group data' })
@Entity({ name: 'messageGroup' })
export default class MessageGroup extends BaseTimestamp {
  @Field({ description: 'group id' })
  @PrimaryColumn('uuid')
  id: string;

  @Field(_type => [String], { description: 'group users' })
  @Column({ type: 'uuid', array: true })
  @IsDefined()
  userIDs: string[];

  @Column({ type: 'text', comment: 'hash of user ids' })
  usersHash: string;

  @Field(_type => Int, { description: 'number of users in group' })
  @Column({ type: 'int' })
  @IsDefined()
  userCount: number;

  @Field(_type => [PublicUser], { description: 'users in active message' })
  users?: PublicUser[];

  @Field(_type => MessageGroupUser, { description: 'user message group data' })
  groupData?: MessageGroupUser;
}
