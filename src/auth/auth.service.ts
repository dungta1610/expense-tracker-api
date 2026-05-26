import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from '../common/types/jwt-payload.type';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // ──────────────────────────────────────────
  // REGISTER
  // ──────────────────────────────────────────
  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Email đã được sử dụng');
    }

    // Hash password với salt rounds = 10
    // Tại sao hash? → Nếu DB bị lộ, attacker không biết password gốc
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        fullName: dto.fullName,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        createdAt: true,
      },
    });

    return user;
  }

  // ──────────────────────────────────────────
  // LOGIN
  // ──────────────────────────────────────────
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // Không nói rõ "email không tồn tại" hay "sai password" → tránh user enumeration attack
    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
      },
      ...tokens,
    };
  }

  // ──────────────────────────────────────────
  // REFRESH TOKEN
  // ──────────────────────────────────────────
  async refreshToken(refreshToken: string) {
    try {
      // 1. Verify chữ ký của refresh token
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      // 2. Tìm tất cả refresh token còn hiệu lực của user trong DB
      const storedTokens = await this.prisma.refreshToken.findMany({
        where: {
          userId: payload.sub,
          expiresAt: { gt: new Date() },
        },
      });

      // 3. So sánh token với các hash trong DB (bcrypt.compare)
      let validToken = null;
      for (const stored of storedTokens) {
        const isMatch = await bcrypt.compare(refreshToken, stored.tokenHash);
        if (isMatch) {
          validToken = stored;
          break;
        }
      }

      if (!validToken) {
        throw new UnauthorizedException('Refresh token không hợp lệ');
      }

      // 4. Xóa token cũ (Refresh Token Rotation)
      // Mỗi lần refresh → tạo token mới, hủy token cũ → giảm rủi ro token bị đánh cắp
      await this.prisma.refreshToken.delete({ where: { id: validToken.id } });

      // 5. Tạo cặp token mới
      return this.generateTokens(payload.sub, payload.email);
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn');
    }
  }

  // ──────────────────────────────────────────
  // LOGOUT
  // ──────────────────────────────────────────
  async logout(userId: string) {
    // Xóa TẤT CẢ refresh token của user → logout khỏi mọi thiết bị
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
    return { message: 'Đăng xuất thành công' };
  }

  // ──────────────────────────────────────────
  // PRIVATE: tạo cặp access + refresh token
  // ──────────────────────────────────────────
  private async generateTokens(userId: string, email: string) {
    const payload: JwtPayload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d',
      }),
    ]);

    // Tính ngày hết hạn cho refresh token (mặc định 7 ngày)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Hash refresh token trước khi lưu DB
    // Tại sao hash? → Nếu DB bị lộ, attacker không dùng được token gốc
    const tokenHash = await bcrypt.hash(refreshToken, 10);

    await this.prisma.refreshToken.create({
      data: { tokenHash, userId, expiresAt },
    });

    return { accessToken, refreshToken };
  }
}
