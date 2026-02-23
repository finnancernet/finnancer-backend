import { IsBoolean, IsDateString } from 'class-validator';

export class UpdateExcludeFromBudgetDto {
  @IsBoolean()
  excludeFromBudget: boolean;
}

export class UpdateEffectiveDateDto {
  @IsDateString()
  effectiveDate: string;
}
