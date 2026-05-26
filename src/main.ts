import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Prefix tất cả routes: /api/v1/...
  app.setGlobalPrefix('api/v1');

  // Cho phép CORS (cần thiết khi gọi API từ frontend)
  app.enableCors();

  // Global Validation Pipe
  // whitelist: true             → bỏ các field không khai báo trong DTO
  // forbidNonWhitelisted: true  → throw 400 nếu client gửi field lạ
  // transform: true             → tự động convert type (vd: "1" → 1)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global exception filter → chuẩn hóa format lỗi
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global interceptor → wrap mọi response thành { success: true, data: ... }
  app.useGlobalInterceptors(new ResponseInterceptor());

  // ─── Swagger ───────────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('Expense Tracker API')
    .setDescription(
      `
API quản lý thu chi cá nhân - Learning NestJS Project

## Authentication
1. Dùng POST /auth/register để tạo tài khoản
2. Dùng POST /auth/login để nhận accessToken và refreshToken
3. Click nút "Authorize" ở trên, nhập accessToken vào ô Bearer
4. Giờ có thể gọi các API cần auth

## Response Format
- Thành công: \`{ "success": true, "data": {...} }\`
- Lỗi: \`{ "success": false, "statusCode": 4xx, "message": [...] }\`
    `,
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Nhập access token từ /auth/login',
      },
      'JWT-auth', // Key này phải khớp với @ApiBearerAuth('JWT-auth') trong controller
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // Giữ token khi F5 trang Swagger
    },
  });
  // ─── End Swagger ───────────────────────────────────────

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`Server running on: http://localhost:${port}/api/v1`);
  console.log(`Swagger docs at:   http://localhost:${port}/api/docs`);
}

bootstrap();
