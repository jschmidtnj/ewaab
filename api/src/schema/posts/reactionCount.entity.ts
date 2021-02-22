import { IsDefined } from 'class-validator';
import { ObjectType, Field, Int } from 'type-graphql';
import { Column, Entity, PrimaryColumn } from 'typeorm';
import { ReactionParentType } from './reaction.entity';

@ObjectType({ description: 'reaction count' })
@Entity({ name: 'reactionCounts' })
export default class ReactionCount {
  @Field(_type => String, { description: 'type of reaction' })
  @PrimaryColumn('text')
  @IsDefined()
  type: string;

  @Field(_type => Int, { description: 'count for reaction type' })
  @Column({ type: 'int' })
  @IsDefined()
  count: number;

  @Field({ description: 'parent' })
  @Column({ type: 'uuid' })
  @IsDefined()
  parent: string;

  @Column({ type: 'enum', enum: ReactionParentType })
  @IsDefined()
  parentType: ReactionParentType;
}

@ObjectType({ description: 'reactions data' })
export class ReactionsData {
  @Field(_type => [ReactionCount], { description: 'counts for all given reactions' })
  counts: ReactionCount[];

  @Field(_type => [String], { description: 'reactions a given user made' })
  reactions: string[];
}
