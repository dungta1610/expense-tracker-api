import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { WalletsModule } from './wallets/wallets.module';
import { CategoriesModule } from './categories/categories.module';
import { TransactionsModule } from './transactions/transactions.module';
import { ReportsModule } from './reports/reports.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Module({
  imports: [
    // ConfigModule.forRoot() load biến môi trường từ .env vào process.env
    // isGlobal: true → dùng ConfigService ở mọi nơi mà không cần import lại
    ConfigModule.forRoot({ isGlobal: true }),

    PrismaModule,    // Global module, cung cấp PrismaService cho toàn app
    AuthModule,
    UsersModule,
    WalletsModule,
    CategoriesModule,
    TransactionsModule,
    ReportsModule,
  ],
  providers: [
    // Đăng ký JwtAuthGuard như GLOBAL GUARD
    // → Mọi route đều yêu cầu JWT, ngoại trừ route có @Public()
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
