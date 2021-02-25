import { Min, Max } from 'class-validator';
import { ArgsType, Field, Int } from 'type-graphql';

const maxPerPage = 20;

@ArgsType()
export class PaginationArgs {
  @Min(0, {
    message: 'page number must be greater than or equal to 0'
  })
  @Field(_type => Int, {
    description: 'page number',
    nullable: true,
    defaultValue: 0
  })
  page: number;

  @Min(1, {
    message: 'per page must be greater than or equal to 1'
  })
  @Max(maxPerPage, {
    message: `per page must be less than or equal to ${maxPerPage}`
  })
  @Field(_type => Int, {
    description: 'number per page',
    nullable: true,
    defaultValue: 10
  })
  perpage: number;
}
