import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateLinkDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  @IsIn(['home', 'more'])
  type?: string;

  @IsString()
  @IsOptional()
  url?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsInt()
  @IsOptional()
  order?: number;
}
