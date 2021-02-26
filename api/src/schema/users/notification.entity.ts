import { IsDefined } from "class-validator";
import { Field, ObjectType, registerEnumType } from "type-graphql";
import { PrimaryColumn, Column, Index, Entity } from "typeorm";

export enum NotificationType {
  admin = 'admin', // global notification
  message = 'message', // received new message
}

registerEnumType(NotificationType, {
  name: 'NotificationType',
  description: 'notification type'
});

@ObjectType({ description: 'notification' })
@Entity({ name: 'notifications' })
export default class Notification {
  @Field({ description: 'notification id' })
  @PrimaryColumn('uuid')
  @IsDefined()
  id: string;

  @Field({ description: 'date created' })
  @Column({ type: 'bigint' })
  @IsDefined()
  created: number;

  @Field({ description: 'date expires' })
  @Column({ type: 'bigint' })
  @IsDefined()
  expires: number;

  @Field(_type => Boolean, { description: 'notification viewed' })
  @Column({ type: 'boolean' })
  @IsDefined()
  viewed: boolean;

  @Field({ description: 'reaction publisher' })
  @Column({ type: 'uuid' })
  @Index()
  @IsDefined()
  user: string;

  @Field(_type => String, { description: 'notification message' })
  @Column({ type: 'text' })
  message: string;

  @Field(_type => NotificationType, { description: 'notification type' })
  @Column({ type: 'enum', enum: NotificationType })
  type: string;

  @Field({ description: 'parent id' })
  @Column({ type: 'uuid' })
  parent: string;
}
