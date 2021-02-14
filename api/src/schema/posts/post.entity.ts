import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ObjectType, Field, registerEnumType } from 'type-graphql';
import { IsDefined } from 'class-validator';
import { PostType } from '../../shared/variables';

registerEnumType(PostType, {
  name: 'PostType',
  description: 'post type',
});

@ObjectType({ description: 'post data, indexed in elasticsearch', isAbstract: true })
export class SearchPost {
  @Field({ description: 'post type' })
  @Column({ type: 'enum', enum: PostType })
  @IsDefined()
  type: PostType;

  @Field({ description: 'title' })
  @Column({ type: 'text' })
  @IsDefined()
  title: string;

  @Field({ description: 'post content' })
  @Column({ type: 'text' })
  @IsDefined()
  content: string;
}

@ObjectType({ description: 'post data' })
@Entity({ name: 'posts' })
export default class Post extends SearchPost {
  @Field()
  @PrimaryGeneratedColumn({ type: 'uuid' })
  id: string;

  @Field({ description: 'post description', nullable: true })
  @Column({ type: 'text' })
  @IsDefined()
  link: string;
}
