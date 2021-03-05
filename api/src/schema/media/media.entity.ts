import { Entity, Column, PrimaryColumn } from 'typeorm';
import { ObjectType, Field, registerEnumType } from 'type-graphql';
import { IsDefined } from 'class-validator';

export enum MediaParentType {
  user = 'user',
  post = 'post',
}

export enum MediaType {
  image = 'image',
  file = 'file',
}

registerEnumType(MediaType, {
  name: 'MediaType',
  description: 'media type, used for determining preview type',
});

@ObjectType({ description: 'media data', isAbstract: true })
export class MediaData {
  @Field({ description: 'media id' })
  @PrimaryColumn('uuid')
  id: string;

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

  @Field(_type => MediaType, { description: 'media type' })
  @Column({ type: 'enum', enum: MediaType })
  @IsDefined()
  type: MediaType;
}

@ObjectType({ description: 'media object' })
@Entity({ name: 'media' })
export default class Media extends MediaData {
  @Field({ description: 'parent' })
  @Column({ type: 'uuid' })
  @IsDefined()
  parent: string;

  @Column({ type: 'enum', enum: MediaParentType })
  @IsDefined()
  parentType: MediaParentType;
}
