import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  ParseUUIDPipe,
  Ip,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { AttemptsService } from './attempts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IpRangeGuard } from '../common/guards/ip-range.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/constants/roles';
import {
  CheckDeviceDto,
  SaveAnswerDto,
  AutoSaveDto,
  EssayGradeDto,
} from './dto';

@ApiTags('attempts')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard)
export class AttemptsController {
  constructor(private readonly attemptsService: AttemptsService) {}

  // ========================
  // MODULE 07 — EXAM ATTEMPT & PRE-CHECK
  // ========================

  /**
   * POST /api/v1/exams/:examId/check-device — Device pre-check
   */
  @Post('v1/exams/:examId/check-device')
  @ApiOperation({ summary: 'Kiểm tra thiết bị trước khi vào thi' })
  @ApiParam({ name: 'examId', description: 'ID đề thi' })
  @ApiResponse({ status: 201, description: 'Kết quả kiểm tra thiết bị' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  checkDevice(@Param('examId') examId: string, @Body() dto: CheckDeviceDto) {
    return this.attemptsService.checkDevice(examId, dto);
  }

  /**
   * POST /api/v1/exams/:examId/start — Start exam attempt
   * Protected by IpRangeGuard to ensure lab machines only.
   */
  @Post('v1/exams/:examId/start')
  @UseGuards(IpRangeGuard)
  @ApiOperation({ summary: 'Bắt đầu lượt làm bài thi (chỉ từ máy phòng lab)' })
  @ApiParam({ name: 'examId', description: 'ID đề thi' })
  @ApiResponse({ status: 201, description: 'Lượt làm bài đã được khởi tạo' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  @ApiResponse({ status: 403, description: 'IP không thuộc dải máy được phép' })
  startExam(
    @Param('examId') examId: string,
    @Request() req: any,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    // examId = examDefinitionId. Service tự resolve Student từ user đăng nhập
    // và snapshot câu hỏi cho lượt làm bài.
    return this.attemptsService.startExam(req.user, examId, ip, userAgent);
  }

  /**
   * GET /api/v1/exams/:examId/attempt — Get attempt status
   */
  @Get('v1/exams/:examId/attempt')
  @ApiOperation({ summary: 'Lấy trạng thái lượt làm bài hiện tại của đề thi' })
  @ApiParam({ name: 'examId', description: 'ID đề thi' })
  @ApiResponse({ status: 200, description: 'Trạng thái lượt làm bài' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy lượt làm bài' })
  getAttempt(@Param('examId') examId: string, @Request() req: any) {
    return this.attemptsService.getAttemptByExam(req.user.id, examId);
  }

  // ========================
  // MODULE 08 — ANSWER MANAGEMENT
  // ========================

  /**
   * POST /api/v1/attempts/:attemptId/answers — Save single answer
   */
  @Post('v1/attempts/:attemptId/answers')
  @ApiOperation({ summary: 'Lưu một câu trả lời' })
  @ApiParam({ name: 'attemptId', description: 'ID lượt làm bài (UUID)' })
  @ApiResponse({ status: 201, description: 'Câu trả lời đã được lưu' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy lượt làm bài' })
  saveAnswer(
    @Param('attemptId', ParseUUIDPipe) attemptId: string,
    @Body() dto: SaveAnswerDto,
  ) {
    return this.attemptsService.saveAnswer(attemptId, dto);
  }

  /**
   * GET /api/v1/attempts/:attemptId/answers — Get all answers
   */
  @Get('v1/attempts/:attemptId/answers')
  @ApiOperation({ summary: 'Lấy toàn bộ câu trả lời của lượt làm bài' })
  @ApiParam({ name: 'attemptId', description: 'ID lượt làm bài (UUID)' })
  @ApiResponse({ status: 200, description: 'Danh sách câu trả lời' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy lượt làm bài' })
  getAnswers(@Param('attemptId', ParseUUIDPipe) attemptId: string) {
    return this.attemptsService.getAnswers(attemptId);
  }

  // ========================
  // MODULE 09 — AUTO SAVE & RECOVERY
  // ========================

  /**
   * POST /api/v1/attempts/:attemptId/autosave — Bulk autosave
   */
  @Post('v1/attempts/:attemptId/autosave')
  @ApiOperation({ summary: 'Tự động lưu hàng loạt câu trả lời' })
  @ApiParam({ name: 'attemptId', description: 'ID lượt làm bài (UUID)' })
  @ApiResponse({ status: 201, description: 'Đã tự động lưu' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy lượt làm bài' })
  autoSave(
    @Param('attemptId', ParseUUIDPipe) attemptId: string,
    @Body() dto: AutoSaveDto,
  ) {
    return this.attemptsService.autoSave(attemptId, dto);
  }

  /**
   * GET /api/v1/attempts/:attemptId/recovery — Recovery data
   */
  @Get('v1/attempts/:attemptId/recovery')
  @ApiOperation({ summary: 'Lấy dữ liệu khôi phục bài làm' })
  @ApiParam({ name: 'attemptId', description: 'ID lượt làm bài (UUID)' })
  @ApiResponse({ status: 200, description: 'Dữ liệu khôi phục' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy lượt làm bài' })
  getRecovery(@Param('attemptId', ParseUUIDPipe) attemptId: string) {
    return this.attemptsService.getRecovery(attemptId);
  }

  // ========================
  // MODULE 10 — SUBMISSION
  // ========================

  /**
   * POST /api/v1/attempts/:attemptId/submit — Submit exam
   */
  @Post('v1/attempts/:attemptId/submit')
  @ApiOperation({ summary: 'Nộp bài thi' })
  @ApiParam({ name: 'attemptId', description: 'ID lượt làm bài (UUID)' })
  @ApiResponse({ status: 201, description: 'Bài thi đã được nộp' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy lượt làm bài' })
  submit(@Param('attemptId', ParseUUIDPipe) attemptId: string) {
    return this.attemptsService.submit(attemptId);
  }

  // ========================
  // MODULE 11 — RESULT
  // ========================

  /**
   * GET /api/v1/results/:attemptId — Get result
   */
  @Get('v1/results/:attemptId')
  @ApiOperation({ summary: 'Lấy kết quả của một lượt làm bài' })
  @ApiParam({ name: 'attemptId', description: 'ID lượt làm bài (UUID)' })
  @ApiResponse({ status: 200, description: 'Kết quả bài thi' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  @ApiResponse({ status: 403, description: 'Kết quả chưa được công bố' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy kết quả' })
  getResult(
    @Param('attemptId', ParseUUIDPipe) attemptId: string,
    @Request() req: any,
  ) {
    // Chuẩn hoá roles về mã (code) — req.user.roles có thể là object {name,code}.
    const roleCodes = (req.user?.roles ?? []).map((r: any) =>
      typeof r === 'string' ? r : r.code,
    );
    return this.attemptsService.getResult(attemptId, roleCodes);
  }

  /**
   * GET /api/v1/attempts/:attemptId/review — Kết quả chi tiết (điểm + từng câu)
   */
  @Get('v1/attempts/:attemptId/review')
  @ApiOperation({ summary: 'Kết quả chi tiết: điểm + đáp án từng câu' })
  @ApiParam({ name: 'attemptId', description: 'ID lượt làm bài (UUID)' })
  @ApiResponse({ status: 200, description: 'Kết quả chi tiết' })
  @ApiResponse({ status: 403, description: 'Kết quả chưa được công bố' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy kết quả' })
  getReview(
    @Param('attemptId', ParseUUIDPipe) attemptId: string,
    @Request() req: any,
  ) {
    const roleCodes = (req.user?.roles ?? []).map((r: any) =>
      typeof r === 'string' ? r : r.code,
    );
    return this.attemptsService.getAttemptReview(attemptId, roleCodes);
  }

  /**
   * GET /api/v1/student/results — Student result history (chỉ kết quả đã công bố)
   */
  @Get('v1/student/results')
  @ApiOperation({ summary: 'Lấy lịch sử kết quả của sinh viên hiện tại' })
  @ApiResponse({ status: 200, description: 'Lịch sử kết quả (đã công bố)' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  getStudentResults(@Request() req: any) {
    return this.attemptsService.getStudentResults(req.user.id);
  }

  // ========================
  // MODULE 12 — PUBLISH RESULT (EPIC-18)
  // ========================

  /**
   * POST /api/v1/exams/:examDefinitionId/results/publish — Công bố kết quả (UC-046)
   */
  @Post('v1/exams/:examDefinitionId/results/publish')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.EXAM_OFFICER)
  @ApiOperation({ summary: 'Công bố kết quả của một đề thi cho sinh viên' })
  @ApiParam({
    name: 'examDefinitionId',
    description: 'ID định nghĩa đề thi (UUID)',
  })
  @ApiResponse({ status: 201, description: 'Số kết quả đã công bố' })
  @ApiResponse({ status: 403, description: 'Không đủ quyền' })
  publishResults(
    @Param('examDefinitionId', ParseUUIDPipe) examDefinitionId: string,
  ) {
    return this.attemptsService.publishResults(examDefinitionId);
  }

  /**
   * POST /api/v1/exams/:examDefinitionId/results/unpublish — Ẩn kết quả (UC-047)
   */
  @Post('v1/exams/:examDefinitionId/results/unpublish')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.EXAM_OFFICER)
  @ApiOperation({ summary: 'Ẩn kết quả của một đề thi' })
  @ApiParam({
    name: 'examDefinitionId',
    description: 'ID định nghĩa đề thi (UUID)',
  })
  @ApiResponse({ status: 201, description: 'Số kết quả đã ẩn' })
  @ApiResponse({ status: 403, description: 'Không đủ quyền' })
  unpublishResults(
    @Param('examDefinitionId', ParseUUIDPipe) examDefinitionId: string,
  ) {
    return this.attemptsService.unpublishResults(examDefinitionId);
  }

  // ========================
  // CHẤM TỰ LUẬN (khảo thí)
  // ========================

  /**
   * GET /api/v1/exams/:examDefinitionId/essays — Danh sách bài tự luận cần chấm.
   */
  @Get('v1/exams/:examDefinitionId/essays')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.EXAM_OFFICER)
  @ApiOperation({ summary: 'Danh sách bài tự luận của một đề (để chấm tay)' })
  @ApiParam({
    name: 'examDefinitionId',
    description: 'ID định nghĩa đề (UUID)',
  })
  @ApiResponse({ status: 200, description: 'Danh sách bài tự luận' })
  @ApiResponse({ status: 403, description: 'Không đủ quyền' })
  listEssays(
    @Param('examDefinitionId', ParseUUIDPipe) examDefinitionId: string,
  ) {
    return this.attemptsService.listEssayAnswers(examDefinitionId);
  }

  /**
   * GET /api/v1/exams/:examDefinitionId/attempts — Danh sách BÀI LÀM của một đề
   * (ai làm, mấy câu, mấy điểm, trạng thái) cho khảo thí/admin theo dõi + đối soát.
   */
  @Get('v1/exams/:examDefinitionId/attempts')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.EXAM_OFFICER)
  @ApiOperation({ summary: 'Danh sách bài làm của một đề (giám sát/đối soát)' })
  @ApiParam({
    name: 'examDefinitionId',
    description: 'ID định nghĩa đề (UUID)',
  })
  @ApiResponse({ status: 200, description: 'Danh sách lượt làm bài' })
  @ApiResponse({ status: 403, description: 'Không đủ quyền' })
  listAttempts(
    @Param('examDefinitionId', ParseUUIDPipe) examDefinitionId: string,
  ) {
    return this.attemptsService.listAttempts(examDefinitionId);
  }

  /**
   * POST /api/v1/attempts/:attemptId/essay-grade — Chấm 1 câu tự luận (0..1).
   */
  @Post('v1/attempts/:attemptId/essay-grade')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.EXAM_OFFICER)
  @ApiOperation({ summary: 'Chấm tay một câu tự luận (điểm 0..1)' })
  @ApiParam({ name: 'attemptId', description: 'ID lượt làm bài (UUID)' })
  @ApiResponse({ status: 201, description: 'Đã chấm, trả điểm câu' })
  @ApiResponse({ status: 403, description: 'Không đủ quyền' })
  gradeEssay(
    @Param('attemptId', ParseUUIDPipe) attemptId: string,
    @Body() dto: EssayGradeDto,
  ) {
    return this.attemptsService.gradeEssay(
      attemptId,
      dto.questionId,
      dto.credit,
    );
  }
}
