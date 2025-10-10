import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsOptional } from 'class-validator';

@InputType()
export class CreateReplyDto {
  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  comment?: string;
}
