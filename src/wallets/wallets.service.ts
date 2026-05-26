import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';

@Injectable()
export class WalletsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateWalletDto) {
    return this.prisma.wallet.create({
      data: {
        name: dto.name,
        balance: dto.balance ?? 0,
        userId,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.wallet.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, walletId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { id: walletId },
    });

    if (!wallet) {
      throw new NotFoundException('Ví không tồn tại');
    }

    // Authorization check: chỉ owner mới được xem ví của mình
    if (wallet.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền truy cập ví này');
    }

    return wallet;
  }

  async update(userId: string, walletId: string, dto: UpdateWalletDto) {
    await this.findOne(userId, walletId); // Kiểm tra tồn tại + quyền

    return this.prisma.wallet.update({
      where: { id: walletId },
      data: { name: dto.name },
    });
  }

  async remove(userId: string, walletId: string) {
    await this.findOne(userId, walletId);

    await this.prisma.wallet.delete({ where: { id: walletId } });

    return { message: 'Xóa ví thành công' };
  }
}
