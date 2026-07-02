import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { ExamsService } from './exams.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/constants/roles';
import {
  CreateExamDto,
  UpdateExamDto,
  ExamQueryDto,
  CreateExamDefinitionDto,
  ExamConfigDto,
} from './dto';

@ApiTags('exams')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard)
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  // ========================
  // EXAM CRUD — /api/v1/exams
  // ========================

  /**
   * GET /api/v1/exams — List exams
   */
  @Get('v1/exams')
  @ApiOperation({ summary: 'Lấy danh sách kỳ thi (có phân trang và lọc)' })
  @ApiResponse({ status: 200, description: 'Danh sách kỳ thi' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  findAll(@Query() query: ExamQueryDto) {
    return this.examsService.findAll(query);
  }

  /**
   * GET /api/v1/exams/:id — Exam detail
   */
  @Get('v1/exams/:id')
  @ApiOperation({ summary: 'Lấy chi tiết một kỳ thi theo ID' })
  @ApiParam({ name: 'id', description: 'ID kỳ thi (UUID)' })
  @ApiResponse({ status: 200, description: 'Chi tiết kỳ thi' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy kỳ thi' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.examsService.findOne(id);
  }

  /**
   * POST /api/v1/exams — Create exam
   */
  @Post('v1/exams')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.EXAM_OFFICER)
  @ApiOperation({ summary: 'Tạo mới một kỳ thi' })
  @ApiResponse({ status: 201, description: 'Kỳ thi đã được tạo' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền (ADMIN/EXAM_OFFICER)',
  })
  create(@Body() dto: CreateExamDto) {
    return this.examsService.create(dto);
  }

  /**
   * PUT /api/v1/exams/:id — Update exam
   */
  @Put('v1/exams/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.EXAM_OFFICER)
  @ApiOperation({ summary: 'Cập nhật thông tin kỳ thi' })
  @ApiParam({ name: 'id', description: 'ID kỳ thi (UUID)' })
  @ApiResponse({ status: 200, description: 'Kỳ thi đã được cập nhật' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền (ADMIN/EXAM_OFFICER)',
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy kỳ thi' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateExamDto) {
    return this.examsService.update(id, dto);
  }

  /**
   * DELETE /api/v1/exams/:id — Delete exam
   */
  @Delete('v1/exams/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.EXAM_OFFICER)
  @ApiOperation({ summary: 'Xóa mềm một kỳ thi' })
  @ApiParam({ name: 'id', description: 'ID kỳ thi (UUID)' })
  @ApiResponse({ status: 200, description: 'Kỳ thi đã được xóa' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  @ApiResponse({ status: 403, description: 'Không có quyền (ADMIN)' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy kỳ thi' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.examsService.remove(id);
  }

  // ========================
  // QUESTIONS — /api/v1/exams/:examId/questions
  // ========================

  /**
   * GET /api/v1/exams/:examId/questions — Get questions for exam (from mock data)
   */
  @Get('v1/exams/:examId/questions')
  @ApiOperation({ summary: 'Lấy danh sách câu hỏi của một kỳ thi' })
  @ApiParam({ name: 'examId', description: 'ID kỳ thi' })
  @ApiResponse({ status: 200, description: 'Danh sách câu hỏi' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  getExamQuestions(@Param('examId') examId: string) {
    return this.examsService.getExamQuestions(examId);
  }

  /**
   * GET /api/v1/exams/mock/definition — Get mock exam definition
   */
  @Get('v1/exams/mock/definition')
  @ApiOperation({ summary: 'Lấy định nghĩa đề thi mẫu (mock)' })
  @ApiResponse({ status: 200, description: 'Định nghĩa đề thi mẫu' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  getMockExamDefinition() {
    return this.examsService.getMockExamDefinition();
  }

  // ========================
  // EXAM CONFIG — Hiện/ẩn kết quả (FR-L-003 / EPIC-24)
  // ========================

  /**
   * GET /api/v1/exam-definitions — Danh sách đề thi (cho sinh viên vào thi)
   */
  @Get('v1/exam-definitions')
  @ApiOperation({ summary: 'Danh sách đề thi để vào thi' })
  @ApiResponse({ status: 200, description: 'Danh sách đề thi' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  listExamDefinitions() {
    return this.examsService.listExamDefinitions();
  }

  /**
   * POST /api/v1/exam-definitions — Tạo định nghĩa đề thi (khảo thí/admin)
   */
  @Post('v1/exam-definitions')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.EXAM_OFFICER)
  @ApiOperation({ summary: 'Tạo định nghĩa đề thi mới' })
  @ApiResponse({ status: 201, description: 'Đề thi đã được tạo' })
  @ApiResponse({ status: 403, description: 'Không đủ quyền' })
  createExamDefinition(@Body() dto: CreateExamDefinitionDto) {
    return this.examsService.createExamDefinition(dto);
  }

  /**
   * GET /api/v1/exam-definitions/:id — Lấy định nghĩa đề (gồm cấu hình showResult)
   */
  @Get('v1/exam-definitions/:id')
  @ApiOperation({
    summary: 'Lấy định nghĩa đề thi (gồm cấu hình hiện/ẩn kết quả)',
  })
  @ApiParam({ name: 'id', description: 'ID định nghĩa đề thi (UUID)' })
  @ApiResponse({ status: 200, description: 'Định nghĩa đề thi' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy đề thi' })
  getExamDefinition(@Param('id', ParseUUIDPipe) id: string) {
    return this.examsService.findExamDefinition(id);
  }

  /**
   * PATCH /api/v1/exam-definitions/:id/config — Cấu hình hiện/ẩn kết quả (khảo thí)
   */
  @Patch('v1/exam-definitions/:id/config')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.EXAM_OFFICER)
  @ApiOperation({ summary: 'Cấu hình cho phép sinh viên xem điểm hay không' })
  @ApiParam({ name: 'id', description: 'ID định nghĩa đề thi (UUID)' })
  @ApiResponse({ status: 200, description: 'Đã cập nhật cấu hình' })
  @ApiResponse({ status: 403, description: 'Không đủ quyền' })
  setExamConfig(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ExamConfigDto,
  ) {
    return this.examsService.setExamConfig(id, dto);
  }
}
