import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class OAuthVerifyDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['google', 'github', 'discord', 'gitlab'])
  provider: string;

  @IsString()
  @IsNotEmpty()
  providerId: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  image?: string;
}
