import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ObjectType, Field } from 'type-graphql';
import { IsDefined } from 'class-validator';

export enum MediaParentType {
  user = 'user',
  post = 'post',
}

@ObjectType({ description: 'media object' })
@Entity({ name: 'media' })
export default class Media {
  @Field()
  @PrimaryGeneratedColumn()
  id: number;

  @Field({ description: 'parent' })
  @Column({ type: 'int' })
  @IsDefined()
  parent: number;

  @Column({ type: 'enum', enum: MediaParentType })
  @IsDefined()
  parentType: MediaParentType;

  @Field({ description: 'mime type of file' })
  @Column({ type: 'text' })
  @IsDefined()
  mime: string;

  @Field({ description: 'file size' })
  @Column({ type: 'bigint' })
  @IsDefined()
  fileSize: number;

  @Field({ description: 'file name' })
  @Column({ type: 'text' })
  @IsDefined()
  name: string;
}
