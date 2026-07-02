import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/constants/roles';
import { ExamCoreService } from './exam-core.service';

/**
 * EPIC-21 — Tích hợp nguồn câu hỏi/lịch THẬT từ exam-core (KT&ĐBCL).
 * Read-only, dành cho khảo thí/admin xem trước nguồn dữ liệu (mock hoặc HTTP thật).
 * KHÔNG bao giờ trả đáp án (dùng getStudentSafeQuestions).
 */
@ApiTags('exam-core')
@ApiBearerAuth()
@Controller('v1/exam-core')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.EXAM_OFFICER)
export class ExamCoreController {
  constructor(private readonly examCore: ExamCoreService) {}

  @Get('source')
  @ApiOperation({ summary: 'Nguồn câu hỏi đang dùng (mock | exam-core)' })
  @ApiResponse({ status: 200, description: 'Tên nguồn' })
  getSource() {
    return { source: this.examCore.source() };
  }

  @Get('questions')
  @ApiOperation({
    summary: 'Xem trước câu hỏi từ exam-core (ĐÃ bỏ đáp án)',
  })
  @ApiQuery({ name: 'bankId', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'difficulty', required: false })
  @ApiResponse({ status: 200, description: 'Danh sách câu hỏi an toàn' })
  async getQuestions(
    @Query('bankId') bankId?: string,
    @Query('type') type?: string,
    @Query('difficulty') difficulty?: string,
  ) {
    const items = await this.examCore.getStudentSafeQuestions({
      bankId,
      type,
      difficulty,
    });
    return { source: this.examCore.source(), total: items.length, items };
  }

  @Get('schedules')
  @ApiOperation({ summary: 'Lịch thi (đợt thi) từ exam-core' })
  @ApiResponse({ status: 200, description: 'Danh sách đợt thi' })
  async getSchedules() {
    const items = await this.examCore.getSchedules();
    return { source: this.examCore.source(), total: items.length, items };
  }

  @Get('matrices')
  @ApiOperation({ summary: 'Ma trận đề (blueprint) từ exam-core' })
  @ApiResponse({ status: 200, description: 'Danh sách ma trận đề' })
  async getMatrices() {
    const items = await this.examCore.getMatrices();
    return { source: this.examCore.source(), total: items.length, items };
  }
}
