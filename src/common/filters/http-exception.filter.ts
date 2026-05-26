import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';

// @Catch(HttpException) nghĩa là filter này bắt TẤT CẢ HttpException
// Mục đích: chuẩn hóa format của error response về một dạng nhất quán
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const exceptionResponse = exception.getResponse();

    // Class-validator trả về mảng message, còn lỗi thông thường trả về string
    const message =
      typeof exceptionResponse === 'string'
        ? [exceptionResponse]
        : (exceptionResponse as any).message || [exception.message];

    response.status(status).json({
      success: false,
      statusCode: status,
      message: Array.isArray(message) ? message : [message],
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
