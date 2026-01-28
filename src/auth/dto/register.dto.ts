import { IsEmail, IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 30)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'username can only contain letters, numbers, underscores and hyphens',
  })
  username: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;
}
