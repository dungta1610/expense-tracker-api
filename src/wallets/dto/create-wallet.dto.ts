import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateWalletDto {
  @ApiProperty({ example: 'Ví tiền mặt', description: 'Tên ví' })
  @IsString()
  @IsNotEmpty({ message: 'Tên ví không được để trống' })
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    example: 1000000,
    description: 'Số dư ban đầu (mặc định 0)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Số dư không được âm' })
  @Type(() => Number)
  balance?: number;
}
