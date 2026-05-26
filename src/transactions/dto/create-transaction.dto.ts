import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TransactionType } from '@prisma/client';

export class CreateTransactionDto {
  @ApiProperty({ example: 50000, description: 'Số tiền giao dịch (đơn vị: VND)' })
  @IsNumber()
  @Min(1, { message: 'Số tiền phải lớn hơn 0' })
  @Type(() => Number)
  amount: number;

  @ApiProperty({
    enum: TransactionType,
    example: TransactionType.EXPENSE,
    description: 'INCOME = thu nhập, EXPENSE = chi tiêu',
  })
  @IsEnum(TransactionType, { message: 'type phải là INCOME hoặc EXPENSE' })
  type: TransactionType;

  @ApiPropertyOptional({ example: 'Ăn phở buổi sáng', description: 'Ghi chú' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({
    example: '2024-01-15T08:00:00.000Z',
    description: 'Ngày giờ thực hiện giao dịch (ISO 8601)',
  })
  @IsDateString()
  @IsNotEmpty()
  transactionDate: string;

  @ApiProperty({ description: 'UUID của ví muốn ghi nhận giao dịch' })
  @IsUUID('4', { message: 'walletId phải là UUID hợp lệ' })
  walletId: string;

  @ApiProperty({ description: 'UUID của danh mục phù hợp với type giao dịch' })
  @IsUUID('4', { message: 'categoryId phải là UUID hợp lệ' })
  categoryId: string;
}
