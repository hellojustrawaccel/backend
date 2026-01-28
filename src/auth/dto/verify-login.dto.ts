import { IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyLoginDto {
  @IsString()
  @IsNotEmpty()
  identifier: string; // Can be username or email

  @IsString()
  @IsNotEmpty()
  @Length(5, 5)
  code: string;
}
