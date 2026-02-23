import { IsBoolean } from 'class-validator';

export class UpdateExcludeFromBudgetDto {
  @IsBoolean()
  excludeFromBudget: boolean;
}
