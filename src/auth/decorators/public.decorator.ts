import { SetMetadata } from '@nestjs/common';

// Key để đánh dấu metadata trên route handler
export const IS_PUBLIC_KEY = 'isPublic';

// Decorator @Public() đánh dấu route KHÔNG cần JWT authentication
// Dùng cho: POST /auth/register, POST /auth/login, POST /auth/refresh
// JwtAuthGuard sẽ đọc metadata này và bỏ qua auth nếu isPublic = true
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
