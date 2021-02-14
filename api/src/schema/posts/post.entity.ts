import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ObjectType, Field, registerEnumType } from 'type-graphql';
import { IsDefined } from 'class-validator';
import { PostType } from '../../shared/variables';

registerEnumType(PostType, {
  name: 'PostType',
  description: 'post type',
});

@ObjectType({ description: 'post data' })
@Entity({ name: 'posts' })
export default class Post {
  @Field()
  @PrimaryGeneratedColumn()
  id: number;

  @Field({ description: 'email verified' })
  @Column({ type: 'boolean' })
  @IsDefined()
  emailVerified: boolean;

  @Field({ description: 'current token version' })
  @Column({ type: 'bigint' })
  @IsDefined()
  tokenVersion: number;

  @Field({ description: 'media auth token' })
  mediaAuth: string;

  @Column({ type: 'text' })
  @IsDefined()
  password: string;
}
