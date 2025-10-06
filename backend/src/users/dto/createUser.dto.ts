import { IsString, IsEmail, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;
}