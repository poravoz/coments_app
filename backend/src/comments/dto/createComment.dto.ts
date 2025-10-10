import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsOptional } from 'class-validator';

@InputType()
export class CreateCommentDto {
  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  comment?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  parentId?: string | null;
}