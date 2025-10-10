import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsOptional, IsBoolean, IsArray } from 'class-validator';

@InputType()
class AttachmentToRemove {
  @Field(() => String)
  @IsString()
  url: string;

  @Field(() => String)
  @IsString()
  type: string;
}

@InputType()
export class UpdateCommentDto {
  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  comment?: string;

  @Field(() => String, { nullable: true })
  @IsBoolean()
  @IsOptional()
  clearAttachments?: boolean;

  @Field(() => [AttachmentToRemove], { nullable: true })
  @IsArray()
  @IsOptional()
  removeAttachments?: AttachmentToRemove[];
}