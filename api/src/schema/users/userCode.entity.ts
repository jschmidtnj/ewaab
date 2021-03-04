import { Entity, Column, PrimaryColumn } from 'typeorm';
import { ObjectType, Field } from 'type-graphql';
import { IsDefined } from 'class-validator';

@ObjectType({ description: 'user codes element' })
@Entity({ name: 'userCodes' })
export default class UserCode {
  @Field({ description: 'user id' })
  @PrimaryColumn('uuid')
  id: string;

  @Field({ description: 'date created' })
  @Column({ type: 'bigint' })
  @IsDefined()
  created: number;

  @Field({ description: 'name' })
  @Column({ type: 'text' })
  @IsDefined()
  name: string;

  @Field({ description: 'current token version' })
  @Column({ type: 'bigint' })
  @IsDefined()
  tokenVersion: number;

  @Column({ type: 'text' })
  @IsDefined()
  code: string; // hashed password
}
