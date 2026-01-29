import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  @IsUrl()
  avatar: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['github', 'gitlab', 'sourcehut'])
  provider: string;

  @IsString()
  @IsNotEmpty()
  @IsUrl()
  repositoryUrl: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsInt()
  @IsOptional()
  order?: number;
}
