import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateCommentDto {
  @IsString()
  @IsOptional()
  comment?: string;

  @IsBoolean()
  @IsOptional()
  clearAttachments?: boolean; // Flag to clear all attachments
}