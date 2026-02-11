import { IsDateString, IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class TransactionQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  accountId?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Start date must be a valid ISO 8601 date string' })
  startDate?: string;

  @IsOptional()
  @IsDateString({}, { message: 'End date must be a valid ISO 8601 date string' })
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxAmount?: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  pending?: boolean;

  @IsOptional()
  @IsString()
  search?: string;
}
