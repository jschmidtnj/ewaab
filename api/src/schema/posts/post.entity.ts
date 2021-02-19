import { Entity, Column, PrimaryColumn } from 'typeorm';
import { ObjectType, Field, registerEnumType, Int } from 'type-graphql';
import { IsDefined } from 'class-validator';
import { BaseTimestamp } from '../utils/baseTimestamp';
import { PostPublisherData } from '../users/user.entity';
import { MediaData } from '../media/media.entity';

export enum PostType {
  ehParticipantNews = 'ehParticipantNews',
  mentorNews = 'mentorNews',
  encourageHer = 'encourageHer',
  community = 'community',
}

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

  @Field(_type => String, { description: 'post link', nullable: true })
  @Column({ type: 'text', nullable: true })
  link?: string | null;

  @Field({ description: 'post publisher' })
  @Column({ type: 'uuid' })
  @IsDefined()
  publisher: string;

  @Field(_type => PostPublisherData, { description: 'publisher user data', nullable: true })
  publisherData?: PostPublisherData;

  @Field(_type => String, { description: 'media for post', nullable: true })
  @Column({ type: 'uuid', nullable: true })
  media?: string | null;

  @Field(_type => MediaData, { description: 'media data', nullable: true })
  mediaData?: MediaData;
}

export enum PostSortOption {
  title = 'title',
  publisher = 'publisher',
  created = 'created',
  updated = 'updated',
}

registerEnumType(PostSortOption, {
  name: 'PostSortOption',
  description: 'post sort options',
});

@ObjectType({ description: 'post count data' })
export class PostCount {
  @Field(_type => PostType, { description: 'post type for count' })
  type: PostType;

  @Field(_type => Int, { description: 'posts count' })
  count: number;
}

@ObjectType({ description: 'post data search results' })
export class SearchPostsResult {
  @Field(_type => [SearchPost], { description: 'results' })
  results: SearchPost[];

  @Field(_type => Int, { description: 'total posts count' })
  count: number;

  @Field(_type => [PostCount], { description: 'aggregate counts of posts' })
  postCounts: PostCount[];
}

@ObjectType({ description: 'post data' })
@Entity({ name: 'posts' })
export default class Post extends SearchPost {
  @Field({ description: 'post id' })
  @PrimaryColumn('uuid')
  id: string;
}
