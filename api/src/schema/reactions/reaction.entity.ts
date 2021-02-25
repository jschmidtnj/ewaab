import { Entity, Column, PrimaryColumn, Index } from 'typeorm';
import { ObjectType, Field, registerEnumType } from 'type-graphql';
import { IsDefined } from 'class-validator';

export enum ReactionParentType {
  post = 'post',
  comment = 'comment',
  message = 'message',
}

registerEnumType(ReactionParentType, {
  name: 'ReactionParentType',
  description: 'reaction parent type'
});

@ObjectType({ description: 'reaction data' })
@Entity({ name: 'reactions' })
export default class Reaction {
  @Field({ description: 'reaction id' })
  @PrimaryColumn('uuid')
  @IsDefined()
  id: string;

  @Field({ description: 'date created' })
  @Column({ type: 'bigint' })
  @IsDefined()
  created: number;

  @Field({ description: 'reaction type' })
  @Column({ type: 'text' })
  @Index()
  @IsDefined()
  reaction: string;

  @Field({ description: 'reaction publisher' })
  @Column({ type: 'uuid' })
  @Index()
  @IsDefined()
  user: string;

  @Field({ description: 'parent' })
  @Column({ type: 'uuid' })
  @IsDefined()
  parent: string;

  @Column({ type: 'enum', enum: ReactionParentType })
  @IsDefined()
  parentType: ReactionParentType;
}
