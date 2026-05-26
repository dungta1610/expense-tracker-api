import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { ReportQueryDto } from './dto/report-query.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../common/types/jwt-payload.type';

@ApiTags('Reports')
@ApiBearerAuth('JWT-auth')
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('monthly')
  @ApiOperation({
    summary: 'Báo cáo tháng: tổng thu/chi, số dư, phân tích theo danh mục',
  })
  getMonthlySummary(
    @CurrentUser() user: JwtPayload,
    @Query() query: ReportQueryDto,
  ) {
    return this.reportsService.getMonthlySummary(user.sub, query);
  }

  @Get('wallets-overview')
  @ApiOperation({ summary: 'Tổng quan ví: số dư từng ví và tổng cộng' })
  getWalletsOverview(@CurrentUser() user: JwtPayload) {
    return this.reportsService.getWalletsOverview(user.sub);
  }

  @Get('trend')
  @ApiOperation({ summary: 'Xu hướng thu chi 6 tháng gần nhất' })
  getLast6MonthsTrend(@CurrentUser() user: JwtPayload) {
    return this.reportsService.getLast6MonthsTrend(user.sub);
  }
}
