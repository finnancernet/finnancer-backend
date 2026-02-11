import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateSyncConfigDto {
  @IsString()
  @IsNotEmpty({ message: 'Item ID is required' })
  itemId: string;

  @IsString()
  @IsNotEmpty({ message: 'Access token is required' })
  accessToken: string;

  @IsString()
  @IsOptional()
  institutionName?: string;
}
