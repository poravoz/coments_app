import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class Attachment {
  @Field(() => String) 
  type: string;

  @Field(() => String) 
  url: string;

  @Field(() => String) 
  originalName: string;
}