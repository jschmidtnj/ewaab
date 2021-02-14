import { ObjectType, Field } from 'type-graphql';

export class RestReturnObj {
  message: string;
  data?: string;
}

@ObjectType({ description: 'return object for graphql mutations' })
export default class ReturnObj {
  @Field({ description: 'object id', nullable: true })
  _id?: string;

  @Field({ description: 'message' })
  message: string;

  @Field({ description: 'other data', nullable: true })
  data?: string;
}
