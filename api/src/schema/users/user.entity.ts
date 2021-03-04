import { Entity, Column, Index, PrimaryColumn } from 'typeorm';
import { ObjectType, Field, registerEnumType, Int } from 'type-graphql';
import { IsDefined } from 'class-validator';
import { BaseTimestamp } from '../utils/baseTimestamp';
import MessageGroup from './messageGroup.entity';
import Notification from './notification.entity';

export enum UserType {
  user = 'user',
  visitor = 'visitor',
  mentor = 'mentor',
  admin = 'admin',
}

registerEnumType(UserType, {
  name: 'UserType',
  description: 'user type',
});

@ObjectType({ description: 'user data that you can get from post / comment search', isAbstract: true })
export class PublisherData extends BaseTimestamp {
  @Field({ description: 'user id' })
  id?: string;

  @Field({ description: 'name' })
  @Column({ type: 'text' })
  @IsDefined()
  name: string;

  @Field({ description: 'username' })
  @Column({ type: 'text' })
  @Index({ unique: true })
  @IsDefined()
  username: string;

  @Field({ description: 'short user description' })
  @Column({ type: 'text' })
  @IsDefined()
  description: string;

  @Field(_type => String, { description: 'avatar id', nullable: true })
  @Column({ type: 'uuid', nullable: true })
  avatar?: string | null;
}

@ObjectType({ description: 'user data, indexed for search', isAbstract: true })
export class SearchUser extends PublisherData {
  @Field({ description: 'email' })
  @Column({ type: 'text' })
  @Index({ unique: true })
  @IsDefined()
  email: string;

  @Field({ description: 'user type' })
  @Column({ type: 'enum', enum: UserType })
  @IsDefined()
  type: UserType;

  @Field({ description: 'major' })
  @Column({ type: 'text' })
  @IsDefined()
  major: string;

  @Field({ description: 'university' })
  @Column({ type: 'text' })
  @IsDefined()
  university: string;

  @Field(_type => Int, { description: 'alumni year', nullable: true })
  @Column({ type: 'int' })
  alumniYear?: number | null;

  @Field(_type => String, { description: 'location latitude longitude', nullable: true })
  @Column({ type: 'text', nullable: true })
  location?: string | null;

  @Field({ description: 'location name' })
  @Column({ type: 'text' })
  @IsDefined()
  locationName: string;
}

export enum UserSortOption {
  name = 'name',
  email = 'email',
  major = 'major',
  location = 'location',
}

registerEnumType(UserSortOption, {
  name: 'UserSortOption',
  description: 'user sort options',
});

@ObjectType({ description: 'user data search results' })
export class SearchUsersResult {
  @Field(_type => [SearchUser], { description: 'results' })
  results: SearchUser[];

  @Field(_type => Int, { description: 'total users count' })
  count: number;
}

@ObjectType({ description: 'public user data (not in search)' })
export class PublicUser extends SearchUser {
  @Field({ description: 'user id' })
  @PrimaryColumn('uuid')
  id: string;

  @Field({ description: 'user pronouns' })
  @Column({ type: 'text' })
  @IsDefined()
  pronouns: string;

  // TODO - currently mentor is defined by name. maybe add link to user eventually
  // then they would be added to the search user object too
  @Field({ description: 'mentor', nullable: true })
  @Column({ type: 'text' })
  mentor?: string;

  @Field(_type => String, { description: 'resume id', nullable: true })
  @Column({ type: 'uuid', nullable: true })
  resume?: string | null;

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

  @Column({ type: 'text' })
  @IsDefined()
  password: string;

  @Field(_type => [MessageGroup], { description: 'active message groups' })
  activeMessageGroups?: MessageGroup[];

  @Field(_type => [Notification], { description: 'current user notifications' })
  notifications?: Notification[];
}
