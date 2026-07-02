import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/constants/roles';
import { ReportingService } from './reporting.service';

/**
 * EPIC-20 — Báo cáo & thống kê. Chỉ ADMIN/EXAM_OFFICER.
 */
@ApiTags('reports')
@ApiBearerAuth()
@Controller('v1/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.EXAM_OFFICER)
export class ReportingController {
  constructor(private readonly reporting: ReportingService) {}

  @Get('overview')
  @ApiOperation({
    summary: 'Tổng quan kết quả theo từng đề (điểm TB, tỉ lệ đạt)',
  })
  @ApiResponse({ status: 200, description: 'Danh sách tổng quan' })
  getOverview() {
    return this.reporting.getOverview();
  }

  @Get('exams/:id')
  @ApiOperation({ summary: 'Thống kê chi tiết một đề (gồm phổ điểm)' })
  @ApiParam({ name: 'id', description: 'ID định nghĩa đề thi (UUID)' })
  @ApiResponse({ status: 200, description: 'Thống kê chi tiết' })
  getExamReport(@Param('id', ParseUUIDPipe) id: string) {
    return this.reporting.getExamReport(id);
  }
}
