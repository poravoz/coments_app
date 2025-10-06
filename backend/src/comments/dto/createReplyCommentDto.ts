import { IsString, IsOptional } from 'class-validator';

export class CreateReplyDto {
  @IsString()
  @IsOptional()
  comment?: string;
}