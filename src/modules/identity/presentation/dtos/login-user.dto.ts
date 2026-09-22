import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginUserDto {
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(100)
  email: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  password: string;
}
