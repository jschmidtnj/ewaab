import { Entity, Column, PrimaryColumn } from 'typeorm';
import { ObjectType, Field, Int } from 'type-graphql';
import { IsDefined } from 'class-validator';
import { PublicUser } from './user.entity';
import { BaseTimestamp } from '../utils/baseTimestamp';

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
}
