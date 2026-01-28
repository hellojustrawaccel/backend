import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class AllByTypeDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['home', 'more'])
  type: string;
}
