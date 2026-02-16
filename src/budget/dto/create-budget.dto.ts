import { IsString, IsNumber, IsIn, IsNotEmpty, Min, IsArray, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBudgetDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  categories: string[];

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  @IsIn(['weekly', 'monthly', 'yearly'])
  period: string;
}
