import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: {
        name: dto.name,
        type: dto.type,
        userId,
      },
    });
  }

  // Lấy danh sách categories với filter tuỳ chọn theo type
  async findAll(userId: string, type?: TransactionType) {
    return this.prisma.category.findMany({
      where: {
        userId,
        ...(type && { type }), // Chỉ thêm filter type nếu được truyền vào
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(userId: string, categoryId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) throw new NotFoundException('Danh mục không tồn tại');
    if (category.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền truy cập danh mục này');
    }

    return category;
  }

  async update(userId: string, categoryId: string, dto: UpdateCategoryDto) {
    await this.findOne(userId, categoryId);

    return this.prisma.category.update({
      where: { id: categoryId },
      data: dto,
    });
  }

  async remove(userId: string, categoryId: string) {
    await this.findOne(userId, categoryId);

    // Prisma sẽ throw lỗi nếu category có transaction liên kết
    // (do schema dùng onDelete: Restrict)
    await this.prisma.category.delete({ where: { id: categoryId } });

    return { message: 'Xóa danh mục thành công' };
  }
}
