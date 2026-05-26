import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ReportQueryDto {
  @ApiProperty({ example: 2024, description: 'Năm cần xem báo cáo' })
  @IsInt()
  @Min(2000)
  @Max(2100)
  @Type(() => Number)
  year: number;

  @ApiProperty({ example: 1, description: 'Tháng cần xem báo cáo (1–12)' })
  @IsInt()
  @Min(1)
  @Max(12)
  @Type(() => Number)
  month: number;

  @ApiPropertyOptional({ description: 'UUID ví (bỏ trống = lấy tất cả ví)' })
  @IsOptional()
  @IsUUID()
  walletId?: string;
}
