import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class RequestCodeDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;
}
