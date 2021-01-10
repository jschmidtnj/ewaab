import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';
import { ObjectType, Field, registerEnumType } from 'type-graphql';
import { IsDefined } from 'class-validator';

export enum UserType {
  user = 'user',
  visitor = 'vistor',
  admin = 'admin',
}

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

  @Field({ description: 'user type' })
  @Column({ type: 'enum', enum: UserType })
  @IsDefined()
  type: UserType;

  @Field({ description: 'current token version' })
  @Column({ type: 'bigint' })
  @IsDefined()
  tokenVersion: number;

  @Field({ description: 'avatar id' })
  @Column({ type: 'int' })
  @IsDefined()
  avatar: number;

  @Field({ description: 'media auth token' })
  mediaAuth: string;

  @Column({ type: 'text' })
  @IsDefined()
  password: string;
}
