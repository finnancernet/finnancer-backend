import { IsString, IsNumber, IsIn, IsNotEmpty, Min, IsOptional, IsArray, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateBudgetDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  categories?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @IsOptional()
  @IsString()
  @IsIn(['weekly', 'monthly', 'yearly'])
  period?: string;
}
