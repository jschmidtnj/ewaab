import { IsDefined } from 'class-validator';
import { ObjectType, Field, Int } from 'type-graphql';
import { Column, Entity, PrimaryColumn } from 'typeorm';
import { ReactionParentType } from './reaction.entity';

@ObjectType({ description: 'reaction count' })
@Entity({ name: 'reactionCounts' })
export default class ReactionCount {
  @Field({ description: 'reaction count id' })
  @PrimaryColumn('uuid')
  @IsDefined()
  id: string;

  @Field(_type => String, { description: 'type of reaction' })
  @Column({ type: 'text' })
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

@ObjectType({ description: 'reaction count data' })
export class ReactionsCountData {
  @Field(_type => [ReactionCount], { description: 'counts for reactions' })
  reactions: ReactionCount[];

  @Field(_type => Int, { description: 'number of total reactions' })
  count: number;
}
