import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';
import { ObjectType, Field, registerEnumType } from 'type-graphql';
import { IsDefined } from 'class-validator';
import { UserType } from '../../shared/variables';

registerEnumType(UserType, {
  name: 'UserType',
  description: 'user type',
});

@ObjectType({ description: 'user data, indexed for search' })
export class SearchUser {
  @Field({ description: 'user id' })
  id?: string;

  @Field({ description: 'email' })
  @Column({ type: 'text' })
  @Index({ unique: true })
  @IsDefined()
  email: string;

  @Field({ description: 'name' })
  @Column({ type: 'text' })
  @IsDefined()
  name: string;

  @Field({ description: 'username' })
  @Column({ type: 'text' })
  @Index({ unique: true })
  @IsDefined()
  username: string;

  @Field({ description: 'user type' })
  @Column({ type: 'enum', enum: UserType })
  @IsDefined()
  type: UserType;

  @Field({ description: 'major' })
  @Column({ type: 'text' })
  @IsDefined()
  major: string;

  @Field({ description: 'location' })
  @Column({ type: 'text' })
  @IsDefined()
  location: string;
}

@ObjectType({ description: 'public user data (not in search)' })
export class PublicUser extends SearchUser {
  @Field({ description: 'user id' })
  @PrimaryGeneratedColumn({ type: 'uuid' })
  id: string;

  @Field({ description: 'avatar id', nullable: true })
  @Column({ type: 'uuid', nullable: true })
  avatar?: string;

  @Field({ description: 'job title' })
  @Column({ type: 'text' })
  @IsDefined()
  jobTitle: string;

  @Field({ description: 'personal url' })
  @Column({ type: 'text' })
  @IsDefined()
  url: string;

  @Field({ description: 'facebook profile' })
  @Column({ type: 'text' })
  @IsDefined()
  facebook: string;

  @Field({ description: 'twitter account' })
  @Column({ type: 'text' })
  @IsDefined()
  twitter: string;

  @Field({ description: 'github profile' })
  @Column({ type: 'text' })
  @IsDefined()
  github: string;

  @Field({ description: 'short user description' })
  @Column({ type: 'text' })
  @IsDefined()
  description: string;

  @Field({ description: 'longer user bio' })
  @Column({ type: 'text' })
  @IsDefined()
  bio: string;
}

@ObjectType({ description: 'user account' })
@Entity({ name: 'users' })
export default class User extends PublicUser {
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
