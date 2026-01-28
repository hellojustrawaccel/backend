import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyCodeDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Length(5, 5)
  code: string;
}
