import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { WalletsService } from './wallets.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../common/types/jwt-payload.type';

@ApiTags('Wallets')
@ApiBearerAuth('JWT-auth')
@Controller('wallets')
export class WalletsController {
  constructor(private walletsService: WalletsService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo ví mới' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateWalletDto) {
    return this.walletsService.create(user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy tất cả ví của tôi' })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.walletsService.findAll(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết ví' })
  @ApiParam({ name: 'id', description: 'UUID của ví' })
  findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.walletsService.findOne(user.sub, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật tên ví' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWalletDto,
  ) {
    return this.walletsService.update(user.sub, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa ví (sẽ xóa luôn các giao dịch trong ví)' })
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.walletsService.remove(user.sub, id);
  }
}
