import { Entity, Column, PrimaryColumn } from 'typeorm';
import { ObjectType, Field, registerEnumType, Int } from 'type-graphql';
import { IsDefined } from 'class-validator';
import { PostType } from '../../shared/variables';
import { BaseTimestamp } from '../utils/baseTimestamp';

registerEnumType(PostType, {
  name: 'PostType',
  description: 'post type',
});

@ObjectType({ description: 'post data, indexed in elasticsearch', isAbstract: true })
export class SearchPost extends BaseTimestamp {
  @Field({ description: 'post id' })
  id?: string;

  @Field({ description: 'title' })
  @Column({ type: 'text' })
  @IsDefined()
  title: string;

  @Field({ description: 'post content' })
  @Column({ type: 'text' })
  @IsDefined()
  content: string;

  @Field({ description: 'post type' })
  @Column({ type: 'enum', enum: PostType })
  @IsDefined()
  type: PostType;

  @Field({ description: 'post publisher' })
  @Column({ type: 'uuid' })
  @IsDefined()
  publisher: string;
}

export enum PostSortOption {
  title = 'title',
  content = 'content',
  publisher = 'publisher',
  created = 'created',
  updated = 'updated',
}

registerEnumType(PostSortOption, {
  name: 'PostSortOption',
  description: 'post sort options',
});

@ObjectType({ description: 'post data search results' })
export class SearchPostsResult {
  @Field(_type => [SearchPost], { description: 'results' })
  results: SearchPost[];

  @Field(_type => Int, { description: 'total posts count' })
  count: number;

  @Field(_type => Int, { description: 'student news count' })
  countStudentNews: number;
  @Field(_type => Int, { description: 'mentor news count' })
  countMentorNews: number;
  @Field(_type => Int, { description: 'encourage her news count' })
  countEncourageHer: number;
  @Field(_type => Int, { description: 'student community count' })
  countStudentCommunity: number;
}

@ObjectType({ description: 'post data' })
@Entity({ name: 'posts' })
export default class Post extends SearchPost {
  @Field({ description: 'post id' })
  @PrimaryColumn('uuid')
  id: string;

  @Field({ description: 'post link', nullable: true })
  @Column({ type: 'text' })
  @IsDefined()
  link: string;
}
