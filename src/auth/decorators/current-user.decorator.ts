import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../../common/types/jwt-payload.type';

// Decorator @CurrentUser() để lấy thông tin user từ JWT đã được validate
// JwtStrategy.validate() đặt kết quả vào request.user
// Decorator này chỉ đơn giản là đọc request.user ra
//
// Cách dùng trong controller:
//   getProfile(@CurrentUser() user: JwtPayload)          → lấy toàn bộ payload
//   getProfile(@CurrentUser('sub') userId: string)       → lấy chỉ field sub
export const CurrentUser = createParamDecorator(
  (field: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as JwtPayload;
    return field ? user?.[field] : user;
  },
);
