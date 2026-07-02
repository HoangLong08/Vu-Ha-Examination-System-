import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('admin')
@ApiBearerAuth()
@Controller('api/v1/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'EXAM_OFFICER')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Lấy số liệu thống kê cho dashboard quản trị' })
  @ApiResponse({ status: 200, description: 'Số liệu thống kê' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền (ADMIN/EXAM_OFFICER)',
  })
  async getDashboardStats() {
    const data = await this.adminService.getDashboardStats();
    return {
      statusCode: 200,
      code: 'SUCCESS',
      message: 'Lấy thống kê thành công',
      data,
    };
  }
}
