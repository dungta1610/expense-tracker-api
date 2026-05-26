import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

// PrismaService mở rộng PrismaClient và tích hợp với lifecycle của NestJS
// - OnModuleInit: kết nối DB khi module khởi động
// - OnModuleDestroy: ngắt kết nối DB khi app shutdown (graceful shutdown)
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
