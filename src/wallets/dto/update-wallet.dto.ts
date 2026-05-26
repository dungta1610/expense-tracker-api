import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateWalletDto {
  @ApiPropertyOptional({ example: 'Ví ngân hàng Vietcombank' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;
}
