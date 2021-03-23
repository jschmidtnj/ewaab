import { Entity, Column, PrimaryColumn } from 'typeorm';
import { ObjectType, Field, registerEnumType, Int } from 'type-graphql';
import { IsDefined } from 'class-validator';
import { BaseTimestamp } from '../utils/baseTimestamp';
import { PublisherData } from '../users/user.entity';
import { MediaData } from '../media/media.entity';
import { SearchComment } from './comment.entity';
import ReactionCount from '../reactions/reactionCount.entity';
import Reaction from '../reactions/reaction.entity';

export enum PostType {
  jobs = 'jobs',
  mentorNews = 'mentorNews',
  bridge = 'bridge',
  community = 'community',
}

registerEnumType(PostType, {
  name: 'PostType',
  description: 'post type',
});

@ObjectType({ description: 'post data, indexed in elasticsearch', isAbstract: true })
export class BaseSearchPost extends BaseTimestamp {
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

  @Field(_type => PostType, { description: 'post type' })
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

  @Field(_type => String, { description: 'media for post', nullable: true })
  @Column({ type: 'uuid', nullable: true })
  media?: string | null;

  @Field(_type => Int, { description: 'number of reactions' })
  @Column({ type: 'int' })
  @IsDefined()
  reactionCount: number;

  @Field(_type => Int, { description: 'number of comments' })
  @Column({ type: 'int' })
  @IsDefined()
  commentCount: number;
}

@ObjectType({ description: 'post data with field resolvers', isAbstract: true })
export class SearchPost extends BaseSearchPost {
  @Field(_type => PublisherData, { description: 'publisher user data', nullable: true })
  publisherData?: PublisherData;

  @Field(_type => MediaData, { description: 'media data', nullable: true })
  mediaData?: MediaData;

  @Field(_type => [SearchComment], { description: 'comments' })
  comments?: SearchComment[];

  @Field(_type => [ReactionCount], { description: 'reactions' })
  reactions?: ReactionCount[];

  @Field(_type => [Reaction], { description: 'user reactions' })
  userReactions?: Reaction[];
}

export enum PostSortOption {
  title = 'title',
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
