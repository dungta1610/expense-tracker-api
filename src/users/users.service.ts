import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        createdAt: true,
        updatedAt: true,
        // Thống kê nhanh số wallet và transaction
        _count: {
          select: {
            wallets: true,
            transactions: true,
          },
        },
      },
    });

    if (!user) throw new NotFoundException('User không tồn tại');

    return user;
  }

  async updateProfile(userId: string, dto: UpdateUserDto) {
    const updateData: any = {};

    if (dto.fullName) updateData.fullName = dto.fullName;
    if (dto.password) updateData.password = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        fullName: true,
        updatedAt: true,
      },
    });
  }
}
