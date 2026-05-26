import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../../common/types/jwt-payload.type';

// JWT Strategy - Passport tích hợp với NestJS
// Flow khi có request đến route cần auth:
//   1. JwtAuthGuard gọi AuthGuard('jwt').canActivate()
//   2. Passport extract token từ Authorization header
//   3. Passport verify chữ ký JWT bằng secretOrKey
//   4. Passport gọi validate() với payload đã decode
//   5. Kết quả của validate() được gắn vào request.user
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET'),
    });
  }

  // Được gọi sau khi JWT verify thành công
  // Return value sẽ trở thành request.user
  async validate(payload: JwtPayload): Promise<JwtPayload> {
    // Verify user vẫn còn tồn tại trong DB (account có thể bị xóa)
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('Tài khoản không tồn tại');
    }

    return payload;
  }
}
