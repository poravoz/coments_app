import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsEmail, IsOptional } from 'class-validator';

@InputType()
export class UpdateUserDto {
  @Field(() => String, { nullable: true })
  @IsEmail()
  @IsOptional()
  email?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  name?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  password?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  avatarUrl?: string;
}