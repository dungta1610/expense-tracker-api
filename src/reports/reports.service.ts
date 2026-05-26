import { Injectable } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ReportQueryDto } from './dto/report-query.dto';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  // ──────────────────────────────────────────
  // Báo cáo tổng hợp theo tháng
  // ──────────────────────────────────────────
  async getMonthlySummary(userId: string, query: ReportQueryDto) {
    const { year, month, walletId } = query;

    // Tính ngày đầu và cuối tháng
    const startDate = new Date(year, month - 1, 1);           // ngày 1 đầu tháng
    const endDate = new Date(year, month, 0, 23, 59, 59, 999); // ngày cuối tháng

    const where: any = {
      userId,
      transactionDate: { gte: startDate, lte: endDate },
    };

    if (walletId) where.walletId = walletId;

    const transactions = await this.prisma.transaction.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, type: true } },
        wallet: { select: { id: true, name: true } },
      },
      orderBy: { transactionDate: 'desc' },
    });

    // Tính tổng và gom nhóm theo danh mục
    let totalIncome = 0;
    let totalExpense = 0;
    const categoryMap = new Map<string, {
      categoryId: string;
      categoryName: string;
      type: TransactionType;
      total: number;
      count: number;
    }>();

    for (const t of transactions) {
      const amount = Number(t.amount);

      if (t.type === TransactionType.INCOME) {
        totalIncome += amount;
      } else {
        totalExpense += amount;
      }

      const key = t.categoryId;
      if (categoryMap.has(key)) {
        categoryMap.get(key)!.total += amount;
        categoryMap.get(key)!.count += 1;
      } else {
        categoryMap.set(key, {
          categoryId: t.category.id,
          categoryName: t.category.name,
          type: t.category.type,
          total: amount,
          count: 1,
        });
      }
    }

    const byCategory = Array.from(categoryMap.values()).sort(
      (a, b) => b.total - a.total,
    );

    return {
      period: { year, month, startDate, endDate },
      summary: {
        totalIncome,
        totalExpense,
        netBalance: totalIncome - totalExpense,
        transactionCount: transactions.length,
      },
      byCategory,
      transactions,
    };
  }

  // ──────────────────────────────────────────
  // Tổng quan số dư các ví
  // ──────────────────────────────────────────
  async getWalletsOverview(userId: string) {
    const wallets = await this.prisma.wallet.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });

    const totalBalance = wallets.reduce((sum, w) => sum + Number(w.balance), 0);

    return { wallets, totalBalance };
  }

  // ──────────────────────────────────────────
  // Xu hướng thu chi 6 tháng gần nhất
  // ──────────────────────────────────────────
  async getLast6MonthsTrend(userId: string) {
    const now = new Date();

    // Tạo mảng 6 tháng gần nhất (từ 5 tháng trước đến tháng hiện tại)
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return { year: d.getFullYear(), month: d.getMonth() + 1 };
    });

    // Chạy query song song cho cả 6 tháng
    const results = await Promise.all(
      months.map(async ({ year, month }) => {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);

        const [income, expense] = await Promise.all([
          this.prisma.transaction.aggregate({
            where: {
              userId,
              type: TransactionType.INCOME,
              transactionDate: { gte: startDate, lte: endDate },
            },
            _sum: { amount: true },
          }),
          this.prisma.transaction.aggregate({
            where: {
              userId,
              type: TransactionType.EXPENSE,
              transactionDate: { gte: startDate, lte: endDate },
            },
            _sum: { amount: true },
          }),
        ]);

        return {
          year,
          month,
          label: `${String(month).padStart(2, '0')}/${year}`,
          totalIncome: Number(income._sum.amount ?? 0),
          totalExpense: Number(expense._sum.amount ?? 0),
        };
      }),
    );

    return results;
  }
}
