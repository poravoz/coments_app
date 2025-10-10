import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsEmail, IsNotEmpty, IsOptional } from 'class-validator';

@InputType()
export class CreateUserDto {
  @Field(() => String)
  @IsEmail()
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  avatarUrl?: string;
}
