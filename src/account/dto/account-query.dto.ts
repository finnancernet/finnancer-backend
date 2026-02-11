import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class AccountQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  subtype?: string;

  @IsOptional()
  @IsString()
  itemId?: string;
}
