import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateExamDto,
  UpdateExamDto,
  ExamQueryDto,
  CreateExamDefinitionDto,
} from './dto';
import { PageDto, PageMetaDto } from '../common/dto';
import { ExamCoreService, stripAnswer } from '../exam-core/exam-core.service';
import { InternalQuestion } from '../exam-core/exam-core.mapper';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class ExamsService {
  constructor(
    private prisma: PrismaService,
    private examCore: ExamCoreService,
  ) {}

  private readonly logger = new Logger(ExamsService.name);

  /** Nguồn câu hỏi đang dùng = exam-core (KT&ĐBCL) hay mock-api JSON nội bộ. */
  private useExamCore(): boolean {
    return this.examCore.source() === 'exam-core';
  }

  /**
   * Đường dẫn file mock questions. Ưu tiên ENV `MOCK_API_PATH` (BE-008: tránh phụ
   * thuộc cwd); mặc định `<cwd>/../mock-api/questions.json`.
   */
  private resolveMockPath(): string {
    return (
      process.env.MOCK_API_PATH ||
      path.resolve(process.cwd(), '..', 'mock-api', 'questions.json')
    );
  }

  /**
   * Phân giải câu hỏi exam-core cho một đề (KÈM đáp án). Ưu tiên:
   *   1) ExamDefinition.examCoreMatrixId  -> RÚT theo ma trận (section/độ khó)
   *   2) ExamDefinition.examCoreBankId    -> lấy cả ngân hàng
   *   3) EXAM_CORE_BANK_ID (env toàn cục) -> fallback
   * Luôn chỉ trả câu TỰ CHẤM được (loại tự luận).
   */
  private async resolveExamCoreQuestions(
    examId: string,
  ): Promise<InternalQuestion[]> {
    let def: {
      examCoreBankId?: string | null;
      examCoreMatrixId?: string | null;
    } | null = null;
    try {
      def = await this.prisma.examDefinition.findUnique({
        where: { id: examId },
      });
    } catch {
      // examId không phải UUID hợp lệ -> dùng fallback env.
    }

    let list: InternalQuestion[];
    if (def?.examCoreMatrixId) {
      list = await this.examCore.assembleFromMatrix(def.examCoreMatrixId);
    } else {
      const bankId =
        def?.examCoreBankId ?? process.env.EXAM_CORE_BANK_ID ?? undefined;
      list = await this.examCore.getQuestionsWithAnswers({ bankId });
    }
    // Giữ câu tự chấm + câu TỰ LUẬN (ESSAY — chấm tay sau). Loại các loại khác
    // chưa hỗ trợ (nếu có).
    return list.filter((q) => q.autoGradable || q.type === 'ESSAY');
  }

  // ========================
  // EXAM CRUD
  // ========================

  /**
   * GET /api/v1/exams — Paginated exam list
   */
  async findAll(query: ExamQueryDto): Promise<PageDto<any>> {
    const where: any = {};

    // Loại trừ các đề đã xóa mềm (soft-deleted)
    where.deletedAt = null;

    if (query.searchKey) {
      where.OR = [
        { name: { contains: query.searchKey, mode: 'insensitive' } },
        { code: { contains: query.searchKey, mode: 'insensitive' } },
      ];
    }

    if (query.academicYear) where.academicYear = query.academicYear;
    if (query.semester) where.semester = query.semester;
    if (query.status) where.status = query.status;

    const [exams, itemCount] = await Promise.all([
      this.prisma.exam.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: { createdAt: query.order === 'ASC' ? 'asc' : 'desc' },
        include: {
          examPeriods: {
            include: {
              sessions: true,
            },
          },
        },
      }),
      this.prisma.exam.count({ where }),
    ]);

    const meta = new PageMetaDto({ pageOptions: query, itemCount });
    return new PageDto(exams, meta);
  }

  /**
   * GET /api/v1/exams/:id — Exam detail
   */
  async findOne(id: string) {
    // Dùng findFirst để có thể lọc deletedAt (findUnique không nhận điều kiện ngoài unique key)
    const exam = await this.prisma.exam.findFirst({
      where: { id, deletedAt: null },
      include: {
        examPeriods: {
          include: {
            sessions: true,
          },
        },
      },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    return exam;
  }

  /**
   * POST /api/v1/exams — Create exam
   */
  async create(dto: CreateExamDto) {
    return this.prisma.exam.create({
      data: {
        code: dto.code,
        name: dto.name,
        academicYear: dto.academicYear,
        semester: dto.semester,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        status: 'DRAFT',
      },
    });
  }

  /**
   * PUT /api/v1/exams/:id — Update exam
   */
  async update(id: string, dto: UpdateExamDto) {
    await this.findOne(id);

    return this.prisma.exam.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.startDate && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate && { endDate: new Date(dto.endDate) }),
        ...(dto.status && { status: dto.status }),
      },
    });
  }

  /**
   * DELETE /api/v1/exams/:id — Delete exam
   */
  async remove(id: string) {
    // BUG-BE-005: API contract yêu cầu "xóa mềm" -> đặt deletedAt thay vì xóa cứng.
    await this.findOne(id);
    await this.prisma.exam.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { message: 'Exam soft-deleted successfully' };
  }

  // ========================
  // EXAM DEFINITIONS
  // ========================

  /**
   * Get exam definition by ID
   */
  async findExamDefinition(id: string) {
    const examDef = await this.prisma.examDefinition.findUnique({
      where: { id },
    });

    if (!examDef) {
      throw new NotFoundException('Exam definition not found');
    }

    return examDef;
  }

  /**
   * GET /api/v1/exam-definitions — Danh sách đề cho sinh viên vào thi.
   * Sắp xếp mới nhất trước.
   */
  async listExamDefinitions() {
    return this.prisma.examDefinition.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Create exam definition
   */
  async createExamDefinition(dto: CreateExamDefinitionDto) {
    return this.prisma.examDefinition.create({
      data: {
        code: dto.code,
        title: dto.title,
        durationMinutes: dto.durationMinutes,
        totalQuestions: dto.totalQuestions,
        externalExamId: dto.externalExamId,
        sourceSystem: dto.sourceSystem,
      },
    });
  }

  /**
   * Cấu hình đề thi (FR-L-003 hiện/ẩn điểm, FR-Q-001..003 trộn câu/đáp án, số lần thi).
   * Chỉ cập nhật các field được truyền.
   */
  async setExamConfig(
    examDefinitionId: string,
    config: {
      showResult?: boolean;
      maxAttempt?: number;
      shuffleQuestions?: boolean;
      shuffleAnswers?: boolean;
      examCoreBankId?: string;
      examCoreMatrixId?: string;
    },
  ) {
    await this.findExamDefinition(examDefinitionId); // ném NotFound nếu thiếu
    const data: Record<string, unknown> = {};
    if (config.showResult !== undefined) data.showResult = config.showResult;
    if (config.maxAttempt !== undefined) data.maxAttempt = config.maxAttempt;
    if (config.shuffleQuestions !== undefined)
      data.shuffleQuestions = config.shuffleQuestions;
    if (config.shuffleAnswers !== undefined)
      data.shuffleAnswers = config.shuffleAnswers;
    // Liên kết exam-core: chuỗi rỗng => gỡ liên kết (null).
    if (config.examCoreBankId !== undefined)
      data.examCoreBankId = config.examCoreBankId || null;
    if (config.examCoreMatrixId !== undefined)
      data.examCoreMatrixId = config.examCoreMatrixId || null;
    return this.prisma.examDefinition.update({
      where: { id: examDefinitionId },
      data,
    });
  }

  /** Trộn ngẫu nhiên một mảng (Fisher–Yates, không đột biến mảng gốc). */
  private shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ========================
  // QUESTIONS (from mock data)
  // ========================

  /**
   * Câu hỏi RAW (KÈM correctAnswer) — chỉ dùng nội bộ để snapshot vào AttemptQuestion
   * khi bắt đầu thi (KHÔNG bao giờ trả ra cho thí sinh). Trả về mảng câu hỏi.
   */
  async getQuestionsWithAnswers(_examId: string): Promise<any[]> {
    // Nguồn THẬT (exam-core): rút theo ma trận / bank theo cấu hình của đề;
    // đã map sẵn về shape nội bộ {options:{key,value}, correctAnswer}.
    if (this.useExamCore()) {
      return this.resolveExamCoreQuestions(_examId);
    }

    const mockPath = this.resolveMockPath();
    try {
      const raw = fs.readFileSync(mockPath, 'utf-8');
      const mockData = JSON.parse(raw);
      return Array.isArray(mockData?.data) ? mockData.data : [];
    } catch (err) {
      // BE-008: KHÔNG nuốt lỗi im lặng — log để debug, vẫn trả rỗng an toàn.
      this.logger.warn(
        `Không đọc được mock questions tại ${mockPath}: ${String(err)}`,
      );
      return [];
    }
  }

  /**
   * GET /api/v1/exams/:examId/questions — Questions for an exam from mock data
   */
  async getExamQuestions(examId: string) {
    // Cấu hình trộn câu/đáp án theo đề (FR-Q-001/002). Bỏ qua nếu examId không hợp lệ.
    let shuffleQuestions = false;
    let shuffleAnswers = false;
    try {
      const def = await this.prisma.examDefinition.findUnique({
        where: { id: examId },
      });
      shuffleQuestions = def?.shuffleQuestions ?? false;
      shuffleAnswers = def?.shuffleAnswers ?? false;
    } catch {
      // examId không phải UUID hợp lệ -> không trộn.
    }

    // Nguồn THẬT (exam-core): rút theo ma trận/bank, BỎ đáp án; áp trộn theo cấu hình.
    if (this.useExamCore()) {
      const resolved = await this.resolveExamCoreQuestions(examId);
      let data: any[] = resolved.map(stripAnswer);
      if (shuffleAnswers) {
        data = data.map((q) => ({ ...q, options: this.shuffle(q.options) }));
      }
      if (shuffleQuestions) data = this.shuffle(data);
      return {
        data,
        meta: {
          page: 1,
          take: data.length,
          itemCount: data.length,
          pageCount: 1,
          hasPreviousPage: false,
          hasNextPage: false,
        },
      };
    }

    // Load questions from mock data
    const mockPath = this.resolveMockPath();

    try {
      const raw = fs.readFileSync(mockPath, 'utf-8');
      const mockData = JSON.parse(raw);

      // BUG-BE-002: KHÔNG được lộ đáp án cho thí sinh.
      // Loại bỏ `correctAnswer` và `explanation`; giữ nguyên id/type/content/options.
      // Trộn câu/đáp án theo cấu hình (key giữ nguyên nên không ảnh hưởng chấm điểm).
      let data = Array.isArray(mockData?.data)
        ? mockData.data.map((q: any) => {
            const { correctAnswer, explanation, ...safe } = q;
            if (shuffleAnswers && Array.isArray(safe.options)) {
              safe.options = this.shuffle(safe.options);
            }
            return safe;
          })
        : mockData?.data;

      if (shuffleQuestions && Array.isArray(data)) {
        data = this.shuffle(data);
      }

      return { ...mockData, data };
    } catch (err) {
      // BE-008: log lỗi đọc mock (không nuốt im lặng), vẫn trả rỗng an toàn.
      this.logger.warn(
        `Không đọc được mock questions tại ${mockPath}: ${String(err)}`,
      );
      return {
        data: [],
        meta: {
          page: 1,
          take: 10,
          itemCount: 0,
          pageCount: 0,
          hasPreviousPage: false,
          hasNextPage: false,
        },
      };
    }
  }

  /**
   * Get mock exam definition
   */
  async getMockExamDefinition() {
    const mockPath =
      process.env.MOCK_EXAM_DEF_PATH ||
      path.resolve(process.cwd(), '..', 'mock-api', 'exam-definition.json');

    try {
      const raw = fs.readFileSync(mockPath, 'utf-8');
      return JSON.parse(raw);
    } catch (err) {
      this.logger.warn(
        `Không đọc được mock exam-definition tại ${mockPath}: ${String(err)}`,
      );
      return null;
    }
  }
}
