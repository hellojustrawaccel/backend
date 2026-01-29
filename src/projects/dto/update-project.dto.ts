import { IsIn, IsInt, IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateProjectDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @IsUrl()
  avatar?: string;

  @IsString()
  @IsOptional()
  @IsIn(['github', 'gitlab', 'sourcehut'])
  provider?: string;

  @IsString()
  @IsOptional()
  @IsUrl()
  repositoryUrl?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsInt()
  @IsOptional()
  order?: number;
}
