import { Entity, Column, PrimaryColumn, Index } from 'typeorm';
import { ObjectType, Field, registerEnumType, Int } from 'type-graphql';
import { IsDefined } from 'class-validator';
import { BaseTimestamp } from '../utils/baseTimestamp';
import { PublisherData } from '../users/user.entity';
import Reaction from '../reactions/reaction.entity';
import ReactionCount from '../reactions/reactionCount.entity';

export enum CommentSortOption {
  created = 'created',
  updated = 'updated',
}

registerEnumType(CommentSortOption, {
  name: 'CommentSortOption',
  description: 'comment sort options',
});

@ObjectType({ description: 'comment data, indexed in elasticsearch', isAbstract: true })
export class SearchComment extends BaseTimestamp {
  @Field({ description: 'comment id' })
  id?: string;

  @Field({ description: 'comment content' })
  @Column({ type: 'text' })
  @IsDefined()
  content: string;

  @Field({ description: 'comment publisher' })
  @Column({ type: 'uuid' })
  @IsDefined()
  publisher: string;

  @Field({ description: 'comment post' })
  @Column({ type: 'uuid' })
  @Index()
  @IsDefined()
  post: string;

  @Field(_type => PublisherData, { description: 'publisher user data', nullable: true })
  publisherData?: PublisherData;
}

@ObjectType({ description: 'comment data search results' })
export class SearchCommentsResult {
  @Field(_type => [SearchComment], { description: 'results' })
  results: SearchComment[];

  @Field(_type => Int, { description: 'total comments count' })
  count: number;

  @Field(_type => [ReactionCount], { description: 'reactions', nullable: true })
  reactions?: ReactionCount[];

  @Field(_type => [Reaction], { description: 'user reactions', nullable: true })
  userReactions?: Reaction[];
}

@ObjectType({ description: 'comment data' })
@Entity({ name: 'comments' })
export default class Comment extends SearchComment {
  @Field({ description: 'comment id' })
  @PrimaryColumn('uuid')
  id: string;
}
