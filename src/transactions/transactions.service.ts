import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  // ──────────────────────────────────────────
  // CREATE - Quan trọng: cập nhật balance ví cùng lúc
  // ──────────────────────────────────────────
  async create(userId: string, dto: CreateTransactionDto) {
    // Validate wallet thuộc về user
    const wallet = await this.prisma.wallet.findUnique({ where: { id: dto.walletId } });
    if (!wallet) throw new NotFoundException('Ví không tồn tại');
    if (wallet.userId !== userId) throw new ForbiddenException('Bạn không có quyền dùng ví này');

    // Validate category thuộc về user
    const category = await this.prisma.category.findUnique({ where: { id: dto.categoryId } });
    if (!category) throw new NotFoundException('Danh mục không tồn tại');
    if (category.userId !== userId) throw new ForbiddenException('Bạn không có quyền dùng danh mục này');

    // Category type phải khớp với transaction type
    if (category.type !== dto.type) {
      throw new BadRequestException(
        `Danh mục "${category.name}" thuộc loại ${category.type}, không thể dùng cho giao dịch ${dto.type}`,
      );
    }

    // Tính thay đổi balance:
    // INCOME → cộng tiền vào ví
    // EXPENSE → trừ tiền khỏi ví
    const balanceDelta =
      dto.type === TransactionType.INCOME ? Number(dto.amount) : -Number(dto.amount);

    // Dùng Prisma $transaction để đảm bảo ATOMIC:
    // Tạo transaction record VÀ cập nhật wallet balance phải thành công cùng nhau.
    // Nếu một bước lỗi → cả hai đều rollback → không bị mất đồng bộ dữ liệu.
    const [transaction] = await this.prisma.$transaction([
      this.prisma.transaction.create({
        data: {
          amount: dto.amount,
          type: dto.type,
          note: dto.note,
          transactionDate: new Date(dto.transactionDate),
          walletId: dto.walletId,
          categoryId: dto.categoryId,
          userId,
        },
        include: {
          wallet: { select: { id: true, name: true } },
          category: { select: { id: true, name: true, type: true } },
        },
      }),
      this.prisma.wallet.update({
        where: { id: dto.walletId },
        data: { balance: { increment: balanceDelta } },
      }),
    ]);

    return transaction;
  }

  // ──────────────────────────────────────────
  // FIND ALL - Có filter và phân trang
  // ──────────────────────────────────────────
  async findAll(userId: string, query: QueryTransactionDto) {
    const { type, walletId, categoryId, from, to, page = 1, limit = 20 } = query;

    // Xây dựng where clause động theo các filter được truyền vào
    const where: any = { userId };
    if (type) where.type = type;
    if (walletId) where.walletId = walletId;
    if (categoryId) where.categoryId = categoryId;

    if (from || to) {
      where.transactionDate = {};
      if (from) where.transactionDate.gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999); // Lấy đến cuối ngày
        where.transactionDate.lte = toDate;
      }
    }

    // Chạy 2 query song song để tối ưu performance
    const [total, transactions] = await Promise.all([
      this.prisma.transaction.count({ where }),
      this.prisma.transaction.findMany({
        where,
        include: {
          wallet: { select: { id: true, name: true } },
          category: { select: { id: true, name: true, type: true } },
        },
        orderBy: { transactionDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: transactions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ──────────────────────────────────────────
  // FIND ONE
  // ──────────────────────────────────────────
  async findOne(userId: string, transactionId: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        wallet: { select: { id: true, name: true } },
        category: { select: { id: true, name: true, type: true } },
      },
    });

    if (!transaction) throw new NotFoundException('Giao dịch không tồn tại');
    if (transaction.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xem giao dịch này');
    }

    return transaction;
  }

  // ──────────────────────────────────────────
  // UPDATE - Phức tạp vì phải tính lại balance
  // ──────────────────────────────────────────
  async update(userId: string, transactionId: string, dto: UpdateTransactionDto) {
    const existing = await this.findOne(userId, transactionId);

    // Validate wallet mới nếu thay đổi
    if (dto.walletId && dto.walletId !== existing.walletId) {
      const wallet = await this.prisma.wallet.findUnique({ where: { id: dto.walletId } });
      if (!wallet) throw new NotFoundException('Ví mới không tồn tại');
      if (wallet.userId !== userId) throw new ForbiddenException('Bạn không có quyền dùng ví này');
    }

    // Validate category mới nếu thay đổi
    if (dto.categoryId && dto.categoryId !== existing.categoryId) {
      const category = await this.prisma.category.findUnique({ where: { id: dto.categoryId } });
      if (!category) throw new NotFoundException('Danh mục mới không tồn tại');
      if (category.userId !== userId) throw new ForbiddenException('Bạn không có quyền dùng danh mục này');
    }

    // Xác định giá trị mới (dùng giá trị cũ nếu không update)
    const newType = dto.type ?? existing.type;
    const newAmount = dto.amount ?? Number(existing.amount);
    const newWalletId = dto.walletId ?? existing.walletId;
    const oldAmount = Number(existing.amount);
    const oldType = existing.type;
    const oldWalletId = existing.walletId;

    // Tính lại balance:
    // Bước 1: Hoàn lại ảnh hưởng của transaction cũ
    const revertOld = oldType === TransactionType.INCOME ? -oldAmount : oldAmount;
    // Bước 2: Áp dụng ảnh hưởng của transaction mới
    const applyNew = newType === TransactionType.INCOME ? newAmount : -newAmount;

    // Xây dựng danh sách operations cho database transaction
    const ops: any[] = [
      this.prisma.transaction.update({
        where: { id: transactionId },
        data: {
          ...(dto.amount !== undefined && { amount: dto.amount }),
          ...(dto.type && { type: dto.type }),
          ...(dto.note !== undefined && { note: dto.note }),
          ...(dto.transactionDate && { transactionDate: new Date(dto.transactionDate) }),
          ...(dto.walletId && { walletId: dto.walletId }),
          ...(dto.categoryId && { categoryId: dto.categoryId }),
        },
        include: {
          wallet: { select: { id: true, name: true } },
          category: { select: { id: true, name: true, type: true } },
        },
      }),
    ];

    if (oldWalletId === newWalletId) {
      // Cùng ví → chỉ cần 1 lần update balance
      ops.push(
        this.prisma.wallet.update({
          where: { id: oldWalletId },
          data: { balance: { increment: revertOld + applyNew } },
        }),
      );
    } else {
      // Khác ví → hoàn tiền ví cũ, trừ tiền ví mới
      ops.push(
        this.prisma.wallet.update({
          where: { id: oldWalletId },
          data: { balance: { increment: revertOld } },
        }),
        this.prisma.wallet.update({
          where: { id: newWalletId },
          data: { balance: { increment: applyNew } },
        }),
      );
    }

    const [updatedTransaction] = await this.prisma.$transaction(ops);
    return updatedTransaction;
  }

  // ──────────────────────────────────────────
  // DELETE - Hoàn lại balance khi xóa
  // ──────────────────────────────────────────
  async remove(userId: string, transactionId: string) {
    const transaction = await this.findOne(userId, transactionId);

    // Hoàn lại tiền về ví khi xóa giao dịch
    const revert =
      transaction.type === TransactionType.INCOME
        ? -Number(transaction.amount)
        : Number(transaction.amount);

    await this.prisma.$transaction([
      this.prisma.transaction.delete({ where: { id: transactionId } }),
      this.prisma.wallet.update({
        where: { id: transaction.walletId },
        data: { balance: { increment: revert } },
      }),
    ]);

    return { message: 'Xóa giao dịch thành công' };
  }
}
