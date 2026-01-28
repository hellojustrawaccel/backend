import { IsBoolean, IsDateString, IsIn, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateExperienceDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  company?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @IsIn(['full-time', 'part-time', 'contract'])
  type?: string;

  @IsString()
  @IsOptional()
  url?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsBoolean()
  @IsOptional()
  current?: boolean;

  @IsInt()
  @IsOptional()
  order?: number;
}
