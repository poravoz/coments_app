import { IsString, IsOptional } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsOptional()
  comment?: string;

  @IsString()
  @IsOptional()
  parentId?: string | null;
}