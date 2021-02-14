import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';
import { ObjectType, Field, registerEnumType } from 'type-graphql';
import { IsDefined } from 'class-validator';
import { UserType } from '../../shared/variables';

registerEnumType(UserType, {
  name: 'UserType',
  description: 'user type',
});

@ObjectType({ description: 'public user data' })
export class PublicUser {
  @Field({ description: 'name' })
  @Column({ type: 'text' })
  @IsDefined()
  name: string;

  @Field({ description: 'username' })
  @Column({ type: 'text' })
  @Index({ unique: true })
  @IsDefined()
  username: string;

  @Field({ description: 'email' })
  @Column({ type: 'text' })
  @Index({ unique: true })
  @IsDefined()
  email: string;

  @Field({ description: 'user type' })
  @Column({ type: 'enum', enum: UserType })
  @IsDefined()
  type: UserType;

  @Field({ description: 'avatar id' })
  @Column({ type: 'int' })
  @IsDefined()
  avatar: number;

  @Field({ description: 'job title' })
  @Column({ type: 'text' })
  jobTitle: string;

  @Field({ description: 'location' })
  @Column({ type: 'text' })
  location: string;

  @Field({ description: 'personal url' })
  @Column({ type: 'text' })
  url: string;

  @Field({ description: 'facebook profile' })
  @Column({ type: 'text' })
  facebook: string;

  @Field({ description: 'twitter account' })
  @Column({ type: 'text' })
  twitter: string;

  @Field({ description: 'github profile' })
  @Column({ type: 'text' })
  github: string;

  @Field({ description: 'short user description' })
  @Column({ type: 'text' })
  description: string;

  @Field({ description: 'longer user bio' })
  @Column({ type: 'text' })
  bio: string;
}

@ObjectType({ description: 'user account' })
@Entity({ name: 'users' })
export default class User extends PublicUser {
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
