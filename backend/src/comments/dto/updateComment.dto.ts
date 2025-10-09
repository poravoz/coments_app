import { IsString, IsOptional, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class AttachmentToRemove {
  @IsString()
  url: string;

  @IsString()
  type: 'image' | 'video' | 'attachment';
}

export class UpdateCommentDto {
  @IsString()
  @IsOptional()
  comment?: string;

  @IsBoolean()
  @IsOptional()
  clearAttachments?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentToRemove)
  @IsOptional()
  removeAttachments?: AttachmentToRemove[];
}