import { Entity, Column, PrimaryColumn } from 'typeorm';
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
  @PrimaryColumn('uuid')
  id: string;

  @Field({ description: 'parent' })
  @Column({ type: 'uuid' })
  @IsDefined()
  parent: string;

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
