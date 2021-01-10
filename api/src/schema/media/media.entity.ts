import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ObjectType, Field } from 'type-graphql';
import { IsDefined } from 'class-validator';

@ObjectType({ description: 'media object' })
@Entity({ name: 'media' })
export default class Media {
  @Field()
  @PrimaryGeneratedColumn()
  id: number;

  @Field({ description: 'owner' })
  @Column({ type: 'int' })
  @IsDefined()
  user: number;

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
