import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UserDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  sub: string;

  @IsEmail()
  @IsNotEmpty()
  @MaxLength(100)
  email: string;
}
