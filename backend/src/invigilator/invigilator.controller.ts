import {
  Controller,
  Get,
  Post,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { InvigilatorService } from './invigilator.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('invigilator')
@ApiBearerAuth()
@Controller('v1/invigilator')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('INVIGILATOR', 'EXAM_OFFICER', 'ADMIN')
export class InvigilatorController {
  constructor(private readonly invigilatorService: InvigilatorService) {}

  @Get('sessions')
  @ApiOperation({ summary: 'Lấy danh sách ca thi của giám thị' })
  @ApiResponse({ status: 200, description: 'Danh sách ca thi' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền (INVIGILATOR/EXAM_OFFICER/ADMIN)',
  })
  async getSessions() {
    return this.invigilatorService.getSessions();
  }

  @Get('sessions/:sessionId/students')
  @ApiOperation({ summary: 'Lấy danh sách sinh viên trong một ca thi' })
  @ApiParam({ name: 'sessionId', description: 'ID ca thi' })
  @ApiResponse({ status: 200, description: 'Danh sách sinh viên' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền (INVIGILATOR/EXAM_OFFICER/ADMIN)',
  })
  async getSessionStudents(@Param('sessionId') sessionId: string) {
    return this.invigilatorService.getSessionStudents(sessionId);
  }

  @Post('sessions/:examId/students/:studentCode/reset-password')
  @ApiOperation({ summary: 'Cấp lại mật khẩu cho thí sinh (mật khẩu = mã SV)' })
  @ApiParam({ name: 'examId', description: 'ID đề/ca thi' })
  @ApiParam({ name: 'studentCode', description: 'Mã số sinh viên' })
  @ApiResponse({ status: 201, description: 'Đã cấp lại mật khẩu' })
  resetPassword(
    @Param('studentCode') studentCode: string,
    @Request() req: any,
  ) {
    return this.invigilatorService.resetPassword(studentCode, req.user.id);
  }

  @Post('sessions/:examId/students/:studentCode/reset-session')
  @ApiOperation({ summary: 'Đổi máy / khôi phục phiên (gỡ ràng buộc máy)' })
  @ApiParam({ name: 'examId', description: 'ID đề/ca thi' })
  @ApiParam({ name: 'studentCode', description: 'Mã số sinh viên' })
  @ApiResponse({ status: 201, description: 'Đã gỡ ràng buộc máy' })
  resetSession(
    @Param('examId') examId: string,
    @Param('studentCode') studentCode: string,
    @Request() req: any,
  ) {
    return this.invigilatorService.resetSession(
      examId,
      studentCode,
      req.user.id,
    );
  }
}
