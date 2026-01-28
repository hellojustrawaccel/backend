import { IsEmpty, IsIn, IsNotEmpty, IsString } from 'class-validator';

export class CreateLinkDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['home', 'more'])
  type: string;

  @IsString()
  @IsEmpty()
  url?: string;

  @IsString()
  @IsEmpty()
  description?: string;

  @IsString()
  @IsEmpty()
  color: string;
}
