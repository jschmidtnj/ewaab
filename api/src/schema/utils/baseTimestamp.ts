import { IsDefined } from 'class-validator';
import { ObjectType, Field } from 'type-graphql';
import { Column } from 'typeorm';

@ObjectType({ description : 'timestamp base class', isAbstract: true })
export class BaseTimestamp {
  @Field({ description: 'date created' })
  @Column({ type: 'timestamp' })
  @IsDefined()
  created: number;

  @Field({ description: 'date updated' })
  @Column({ type: 'timestamp' })
  @IsDefined()
  updated: number;
}
