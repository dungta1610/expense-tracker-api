import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// @Global() → PrismaService có thể inject ở BẤT KỲ module nào
// mà không cần phải import PrismaModule vào từng module con
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
