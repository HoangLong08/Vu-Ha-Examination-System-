import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { ExamsService } from './exams.service';
import { PrismaService } from '../prisma/prisma.service';
import { ExamCoreService } from '../exam-core/exam-core.service';
import { ExamQueryDto, ExamStatus } from './dto';
import { Order, PageDto } from '../common/dto';

// Mock module fs để readFileSync có thể spy/override được trong từng test
// (interop CJS/ESM khiến jest.spyOn trực tiếp trên fs bị "Cannot redefine property").
jest.mock('fs', () => {
  const actual = jest.requireActual('fs');
  return {
    ...actual,
    readFileSync: jest.fn(actual.readFileSync),
  };
});

/**
 * Test NGHIỆP VỤ cho QUẢN LÝ ĐỀ THI & CÂU HỎI (ExamsService).
 *
 * Nguyên tắc: test phản ánh KỲ VỌNG ĐÚNG của nghiệp vụ.
 * Nếu code sai/thiếu thì test FAIL (không làm yếu test để pass).
 */

// Helper build ExamQueryDto đầy đủ (kèm getter skip) như controller sẽ truyền vào.
function buildQuery(partial: Partial<ExamQueryDto> = {}): ExamQueryDto {
  const q = new ExamQueryDto();
  q.page = partial.page ?? 1;
  q.take = partial.take ?? 10;
  q.order = partial.order ?? Order.DESC;
  q.searchKey = partial.searchKey;
  q.academicYear = partial.academicYear;
  q.semester = partial.semester;
  q.status = partial.status;
  return q;
}

describe('ExamsService', () => {
  let service: ExamsService;
  let examCore: {
    source: jest.Mock;
    getQuestionsWithAnswers: jest.Mock;
    getStudentSafeQuestions: jest.Mock;
    assembleFromMatrix: jest.Mock;
  };
  let prisma: {
    exam: {
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    examDefinition: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      exam: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      examDefinition: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    examCore = {
      source: jest.fn(() => 'mock'),
      getQuestionsWithAnswers: jest.fn(async () => []),
      getStudentSafeQuestions: jest.fn(async () => []),
      assembleFromMatrix: jest.fn(async () => []),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExamsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ExamCoreService, useValue: examCore },
      ],
    }).compile();

    service = module.get<ExamsService>(ExamsService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ============================================================
  // findAll — phân trang + filter + orderBy
  // ============================================================
  describe('findAll', () => {
    it('build where chỉ lọc deletedAt=null khi không có filter và trả PageDto với meta đúng', async () => {
      const exams = [{ id: 'e1' }, { id: 'e2' }];
      prisma.exam.findMany.mockResolvedValue(exams);
      prisma.exam.count.mockResolvedValue(2);

      const query = buildQuery({ page: 1, take: 10 });
      const result = await service.findAll(query);

      expect(result).toBeInstanceOf(PageDto);
      expect(result.data).toBe(exams);
      expect(result.meta.itemCount).toBe(2);
      expect(result.meta.page).toBe(1);
      expect(result.meta.take).toBe(10);
      expect(result.meta.pageCount).toBe(1);
      expect(result.meta.hasPreviousPage).toBe(false);
      expect(result.meta.hasNextPage).toBe(false);

      const callArg = prisma.exam.findMany.mock.calls[0][0];
      // BUG-BE-005: phải lọc đề đã xóa mềm
      expect(callArg.where).toEqual({ deletedAt: null });
    });

    it('build where với searchKey (OR name/code, insensitive)', async () => {
      prisma.exam.findMany.mockResolvedValue([]);
      prisma.exam.count.mockResolvedValue(0);

      await service.findAll(buildQuery({ searchKey: 'TOEIC' }));

      const where = prisma.exam.findMany.mock.calls[0][0].where;
      expect(where.OR).toEqual([
        { name: { contains: 'TOEIC', mode: 'insensitive' } },
        { code: { contains: 'TOEIC', mode: 'insensitive' } },
      ]);
    });

    it('build where với academicYear + semester + status', async () => {
      prisma.exam.findMany.mockResolvedValue([]);
      prisma.exam.count.mockResolvedValue(0);

      await service.findAll(
        buildQuery({
          academicYear: '2025-2026',
          semester: 'HK1',
          status: ExamStatus.ACTIVE,
        }),
      );

      const where = prisma.exam.findMany.mock.calls[0][0].where;
      expect(where).toEqual({
        deletedAt: null,
        academicYear: '2025-2026',
        semester: 'HK1',
        status: 'ACTIVE',
      });
    });

    it('áp dụng skip/take phân trang đúng (page 3, take 5 => skip 10)', async () => {
      prisma.exam.findMany.mockResolvedValue([]);
      prisma.exam.count.mockResolvedValue(42);

      const query = buildQuery({ page: 3, take: 5 });
      const result = await service.findAll(query);

      const callArg = prisma.exam.findMany.mock.calls[0][0];
      expect(callArg.skip).toBe(10); // (3-1)*5
      expect(callArg.take).toBe(5);

      // meta tính từ itemCount=42, take=5 => 9 trang; page 3 có cả prev & next
      expect(result.meta.pageCount).toBe(9);
      expect(result.meta.hasPreviousPage).toBe(true);
      expect(result.meta.hasNextPage).toBe(true);
    });

    it('orderBy createdAt asc khi order=ASC', async () => {
      prisma.exam.findMany.mockResolvedValue([]);
      prisma.exam.count.mockResolvedValue(0);

      await service.findAll(buildQuery({ order: Order.ASC }));

      expect(prisma.exam.findMany.mock.calls[0][0].orderBy).toEqual({
        createdAt: 'asc',
      });
    });

    it('orderBy createdAt desc khi order=DESC (mặc định)', async () => {
      prisma.exam.findMany.mockResolvedValue([]);
      prisma.exam.count.mockResolvedValue(0);

      await service.findAll(buildQuery({ order: Order.DESC }));

      expect(prisma.exam.findMany.mock.calls[0][0].orderBy).toEqual({
        createdAt: 'desc',
      });
    });

    it('include examPeriods.sessions để trả cấu trúc đầy đủ', async () => {
      prisma.exam.findMany.mockResolvedValue([]);
      prisma.exam.count.mockResolvedValue(0);

      await service.findAll(buildQuery());

      expect(prisma.exam.findMany.mock.calls[0][0].include).toEqual({
        examPeriods: { include: { sessions: true } },
      });
    });
  });

  // ============================================================
  // findOne
  // ============================================================
  describe('findOne', () => {
    it('trả exam khi tồn tại (findFirst lọc deletedAt=null)', async () => {
      const exam = { id: 'e1', name: 'Đề thi C' };
      prisma.exam.findFirst.mockResolvedValue(exam);

      await expect(service.findOne('e1')).resolves.toBe(exam);
      expect(prisma.exam.findFirst).toHaveBeenCalledWith({
        where: { id: 'e1', deletedAt: null },
        include: { examPeriods: { include: { sessions: true } } },
      });
    });

    it('ném NotFoundException khi không tồn tại', async () => {
      prisma.exam.findFirst.mockResolvedValue(null);
      await expect(service.findOne('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  // ============================================================
  // create
  // ============================================================
  describe('create', () => {
    it('set status=DRAFT và parse startDate/endDate thành Date', async () => {
      prisma.exam.create.mockImplementation(({ data }) => ({
        id: 'new',
        ...data,
      }));

      const dto = {
        code: 'EX01',
        name: 'Đề thi mẫu',
        academicYear: '2025-2026',
        semester: 'HK1',
        startDate: '2026-06-01T00:00:00.000Z',
        endDate: '2026-06-30T00:00:00.000Z',
      };

      await service.create(dto);

      const data = prisma.exam.create.mock.calls[0][0].data;
      expect(data.status).toBe('DRAFT');
      expect(data.code).toBe('EX01');
      expect(data.name).toBe('Đề thi mẫu');
      expect(data.academicYear).toBe('2025-2026');
      expect(data.semester).toBe('HK1');
      expect(data.startDate).toBeInstanceOf(Date);
      expect(data.endDate).toBeInstanceOf(Date);
      expect(data.startDate.toISOString()).toBe('2026-06-01T00:00:00.000Z');
      expect(data.endDate.toISOString()).toBe('2026-06-30T00:00:00.000Z');
    });
  });

  // ============================================================
  // update
  // ============================================================
  describe('update', () => {
    it('ném NotFound khi exam không tồn tại (không gọi update)', async () => {
      prisma.exam.findFirst.mockResolvedValue(null);

      await expect(
        service.update('missing', { name: 'X' } as any),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.exam.update).not.toHaveBeenCalled();
    });

    it('chỉ cập nhật field được cung cấp; parse Date cho startDate/endDate', async () => {
      prisma.exam.findFirst.mockResolvedValue({ id: 'e1' });
      prisma.exam.update.mockImplementation(({ data }) => data);

      await service.update('e1', {
        name: 'Tên mới',
        startDate: '2026-07-01T00:00:00.000Z',
        status: ExamStatus.ACTIVE,
      });

      const data = prisma.exam.update.mock.calls[0][0].data;
      expect(data.name).toBe('Tên mới');
      expect(data.status).toBe('ACTIVE');
      expect(data.startDate).toBeInstanceOf(Date);
      // endDate không truyền => không có trong data
      expect('endDate' in data).toBe(false);
    });
  });

  // ============================================================
  // remove — BUG-BE-005: phải SOFT delete (set deletedAt), không xóa cứng
  // ============================================================
  describe('remove', () => {
    it('ném NotFound khi exam không tồn tại (không gọi update/delete)', async () => {
      prisma.exam.findFirst.mockResolvedValue(null);

      await expect(service.remove('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.exam.update).not.toHaveBeenCalled();
      expect(prisma.exam.delete).not.toHaveBeenCalled();
    });

    it('SOFT delete: gọi prisma.exam.update set deletedAt và trả message', async () => {
      prisma.exam.findFirst.mockResolvedValue({ id: 'e1' });
      prisma.exam.update.mockResolvedValue({ id: 'e1' });

      const result = await service.remove('e1');

      expect(result).toEqual({ message: 'Exam soft-deleted successfully' });

      expect(prisma.exam.update).toHaveBeenCalledTimes(1);
      const arg = prisma.exam.update.mock.calls[0][0];
      expect(arg.where).toEqual({ id: 'e1' });
      expect(arg.data.deletedAt).toBeInstanceOf(Date);
    });

    it('KHÔNG hard delete: không gọi prisma.exam.delete', async () => {
      // API contract yêu cầu "xóa mềm" => không được dùng prisma.exam.delete.
      prisma.exam.findFirst.mockResolvedValue({ id: 'e1' });
      prisma.exam.update.mockResolvedValue({ id: 'e1' });

      await service.remove('e1');

      expect(prisma.exam.delete).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // Exam definitions
  // ============================================================
  describe('exam definitions', () => {
    it('findExamDefinition ném NotFound khi thiếu', async () => {
      prisma.examDefinition.findUnique.mockResolvedValue(null);
      await expect(service.findExamDefinition('x')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('findExamDefinition trả definition khi có', async () => {
      const def = { id: 'd1' };
      prisma.examDefinition.findUnique.mockResolvedValue(def);
      await expect(service.findExamDefinition('d1')).resolves.toBe(def);
    });

    it('listExamDefinitions trả danh sách (mới nhất trước)', async () => {
      const defs = [{ id: 'd2' }, { id: 'd1' }];
      prisma.examDefinition.findMany.mockResolvedValue(defs);
      await expect(service.listExamDefinitions()).resolves.toBe(defs);
      expect(prisma.examDefinition.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
    });

    it('createExamDefinition map đúng các field', async () => {
      prisma.examDefinition.create.mockImplementation(({ data }) => data);
      const dto = {
        code: 'DEF1',
        title: 'Định nghĩa đề',
        durationMinutes: 90,
        totalQuestions: 40,
        externalExamId: 'ext-1',
        sourceSystem: 'LEGACY',
      };
      await service.createExamDefinition(dto);
      expect(prisma.examDefinition.create.mock.calls[0][0].data).toEqual(dto);
    });
  });

  // ============================================================
  // getExamQuestions — đọc mock data
  // ============================================================
  describe('getExamQuestions', () => {
    it('trả đúng dữ liệu mock (data + meta)', async () => {
      const result = await service.getExamQuestions('any-exam-id');

      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBe(4);
      expect(result.meta.itemCount).toBe(4);

      const types = result.data.map((q: any) => q.type).sort();
      expect(types).toEqual(
        [
          'MULTIPLE_CHOICE',
          'SINGLE_CHOICE',
          'SINGLE_CHOICE',
          'TRUE_FALSE',
        ].sort(),
      );
    });

    it('BUG-BE-002: KHÔNG lộ đáp án — response loại bỏ correctAnswer & explanation', async () => {
      const result = await service.getExamQuestions('any-exam-id');

      expect(result.data.length).toBe(4);
      for (const q of result.data) {
        // Tuyệt đối không được rò đáp án/giải thích cho thí sinh
        expect('correctAnswer' in q).toBe(false);
        expect('explanation' in q).toBe(false);
        // nhưng vẫn giữ các field cần để hiển thị
        expect(q.id).toBeDefined();
        expect(q.type).toBeDefined();
        expect(Array.isArray(q.options)).toBe(true);
      }
    });

    it('fallback trả mảng rỗng + meta khi đọc file lỗi/không tồn tại', async () => {
      (fs.readFileSync as jest.Mock).mockImplementationOnce(() => {
        throw new Error('ENOENT');
      });

      const result = await service.getExamQuestions('any');

      expect(result.data).toEqual([]);
      expect(result.meta).toEqual({
        page: 1,
        take: 10,
        itemCount: 0,
        pageCount: 0,
        hasPreviousPage: false,
        hasNextPage: false,
      });
    });
  });

  describe('getMockExamDefinition', () => {
    it('trả null khi file không tồn tại', async () => {
      (fs.readFileSync as jest.Mock).mockImplementationOnce(() => {
        throw new Error('ENOENT');
      });
      await expect(service.getMockExamDefinition()).resolves.toBeNull();
    });
  });

  describe('setExamConfig (FR-L-003 / FR-Q)', () => {
    it('chỉ cập nhật field được truyền', async () => {
      prisma.examDefinition.findUnique.mockResolvedValue({ id: 'd1' });
      prisma.examDefinition.update.mockImplementation(({ data }: any) => data);
      await service.setExamConfig('d1', { showResult: false, maxAttempt: 3 });
      const arg = prisma.examDefinition.update.mock.calls[0][0];
      expect(arg.where).toEqual({ id: 'd1' });
      expect(arg.data).toEqual({ showResult: false, maxAttempt: 3 });
    });

    it('ném NotFound khi đề không tồn tại', async () => {
      prisma.examDefinition.findUnique.mockResolvedValue(null);
      await expect(
        service.setExamConfig('x', { showResult: true }),
      ).rejects.toThrow();
      expect(prisma.examDefinition.update).not.toHaveBeenCalled();
    });

    it('liên kết exam-core: lưu examCoreBankId + examCoreMatrixId', async () => {
      prisma.examDefinition.findUnique.mockResolvedValue({ id: 'd1' });
      prisma.examDefinition.update.mockImplementation(({ data }: any) => data);
      await service.setExamConfig('d1', {
        examCoreBankId: 'bank-9',
        examCoreMatrixId: 'mx-9',
      });
      expect(prisma.examDefinition.update.mock.calls[0][0].data).toEqual({
        examCoreBankId: 'bank-9',
        examCoreMatrixId: 'mx-9',
      });
    });

    it('chuỗi rỗng => gỡ liên kết (null)', async () => {
      prisma.examDefinition.findUnique.mockResolvedValue({ id: 'd1' });
      prisma.examDefinition.update.mockImplementation(({ data }: any) => data);
      await service.setExamConfig('d1', {
        examCoreBankId: '',
        examCoreMatrixId: '',
      });
      expect(prisma.examDefinition.update.mock.calls[0][0].data).toEqual({
        examCoreBankId: null,
        examCoreMatrixId: null,
      });
    });
  });

  describe('getQuestionsWithAnswers (snapshot — KÈM correctAnswer)', () => {
    it('trả mảng câu hỏi gồm correctAnswer', async () => {
      (fs.readFileSync as jest.Mock).mockReturnValueOnce(
        JSON.stringify({
          data: [{ id: 'q1', type: 'SINGLE_CHOICE', correctAnswer: 'B' }],
        }),
      );
      const arr = await service.getQuestionsWithAnswers('e1');
      expect(arr).toHaveLength(1);
      expect(arr[0].correctAnswer).toBe('B');
    });

    it('trả [] khi đọc file lỗi', async () => {
      (fs.readFileSync as jest.Mock).mockImplementationOnce(() => {
        throw new Error('ENOENT');
      });
      expect(await service.getQuestionsWithAnswers('e1')).toEqual([]);
    });

    it('nguồn exam-core: giữ câu tự chấm + ESSAY (chấm tay), loại loại khác', async () => {
      examCore.source.mockReturnValue('exam-core');
      examCore.getQuestionsWithAnswers.mockResolvedValue([
        {
          id: 'q1',
          type: 'SINGLE_CHOICE',
          correctAnswer: 'B',
          autoGradable: true,
        },
        { id: 'q2', type: 'ESSAY', correctAnswer: null, autoGradable: false },
        { id: 'q3', type: 'UNKNOWN', correctAnswer: null, autoGradable: false },
      ]);
      const arr = await service.getQuestionsWithAnswers('e1');
      // giữ q1 (tự chấm) + q2 (ESSAY chấm tay); loại q3 (loại chưa hỗ trợ)
      expect(arr.map((q: any) => q.id)).toEqual(['q1', 'q2']);
      expect(examCore.getQuestionsWithAnswers).toHaveBeenCalled();
    });
  });

  describe('getExamQuestions — nguồn exam-core (đã bỏ đáp án)', () => {
    it('trả câu tự chấm, không có correctAnswer', async () => {
      examCore.source.mockReturnValue('exam-core');
      prisma.examDefinition.findUnique.mockResolvedValue({
        shuffleQuestions: false,
        shuffleAnswers: false,
      });
      examCore.getQuestionsWithAnswers.mockResolvedValue([
        {
          id: 'q1',
          type: 'SINGLE_CHOICE',
          options: [{ key: 'A', value: 'x' }],
          correctAnswer: 'A',
          modelAnswer: null,
          autoGradable: true,
        },
        {
          id: 'q2',
          type: 'ESSAY',
          options: [],
          correctAnswer: null,
          modelAnswer: 'mẫu',
          autoGradable: false,
        },
      ]);
      const res: any = await service.getExamQuestions(
        '11111111-1111-4111-8111-111111111111',
      );
      // giữ cả ESSAY (chấm tay) — q1 + q2
      expect(res.data.map((q: any) => q.id)).toEqual(['q1', 'q2']);
      expect(res.data[0]).not.toHaveProperty('correctAnswer');
      expect(res.data[0]).not.toHaveProperty('modelAnswer');
      expect(res.meta.itemCount).toBe(2);
    });
  });

  describe('resolveExamCoreQuestions — ưu tiên ma trận > bank > env', () => {
    it('đề có examCoreMatrixId => RÚT theo ma trận', async () => {
      examCore.source.mockReturnValue('exam-core');
      prisma.examDefinition.findUnique.mockResolvedValue({
        examCoreMatrixId: 'mx-1',
        examCoreBankId: 'bank-x',
      });
      examCore.assembleFromMatrix.mockResolvedValue([
        {
          id: 'a1',
          type: 'SINGLE_CHOICE',
          correctAnswer: 'A',
          autoGradable: true,
        },
      ]);
      const arr = await service.getQuestionsWithAnswers('e1');
      expect(examCore.assembleFromMatrix).toHaveBeenCalledWith('mx-1');
      expect(examCore.getQuestionsWithAnswers).not.toHaveBeenCalled();
      expect(arr.map((q: any) => q.id)).toEqual(['a1']);
    });

    it('đề chỉ có examCoreBankId => lấy cả bank đó', async () => {
      examCore.source.mockReturnValue('exam-core');
      prisma.examDefinition.findUnique.mockResolvedValue({
        examCoreMatrixId: null,
        examCoreBankId: 'bank-x',
      });
      examCore.getQuestionsWithAnswers.mockResolvedValue([
        {
          id: 'b1',
          type: 'SINGLE_CHOICE',
          correctAnswer: 'A',
          autoGradable: true,
        },
      ]);
      await service.getQuestionsWithAnswers('e1');
      expect(examCore.getQuestionsWithAnswers).toHaveBeenCalledWith({
        bankId: 'bank-x',
      });
      expect(examCore.assembleFromMatrix).not.toHaveBeenCalled();
    });

    it('không có link + examId lỗi => fallback EXAM_CORE_BANK_ID (env)', async () => {
      examCore.source.mockReturnValue('exam-core');
      prisma.examDefinition.findUnique.mockRejectedValue(
        new Error('invalid uuid'),
      );
      process.env.EXAM_CORE_BANK_ID = 'env-bank';
      examCore.getQuestionsWithAnswers.mockResolvedValue([]);
      await service.getQuestionsWithAnswers('không-uuid');
      expect(examCore.getQuestionsWithAnswers).toHaveBeenCalledWith({
        bankId: 'env-bank',
      });
      delete process.env.EXAM_CORE_BANK_ID;
    });
  });

  describe('getExamQuestions — trộn câu/đáp án (FR-Q-001/002)', () => {
    const mockQs = {
      data: [
        {
          id: 'q1',
          type: 'SINGLE_CHOICE',
          correctAnswer: 'A',
          options: [
            { key: 'A', value: '1' },
            { key: 'B', value: '2' },
          ],
        },
        {
          id: 'q2',
          type: 'SINGLE_CHOICE',
          correctAnswer: 'B',
          options: [
            { key: 'A', value: '3' },
            { key: 'B', value: '4' },
          ],
        },
      ],
      meta: {},
    };

    it('shuffle bật: giữ đủ câu + đủ option, ẩn correctAnswer', async () => {
      prisma.examDefinition.findUnique.mockResolvedValue({
        shuffleQuestions: true,
        shuffleAnswers: true,
      });
      (fs.readFileSync as jest.Mock).mockReturnValueOnce(
        JSON.stringify(mockQs),
      );
      const res: any = await service.getExamQuestions('e1');
      expect(res.data).toHaveLength(2);
      expect(res.data[0].correctAnswer).toBeUndefined();
      expect(res.data.every((q: any) => q.options.length === 2)).toBe(true);
    });

    it('không trộn khi examId không hợp lệ (findUnique lỗi) — vẫn trả câu hỏi', async () => {
      prisma.examDefinition.findUnique.mockRejectedValue(new Error('invalid'));
      (fs.readFileSync as jest.Mock).mockReturnValueOnce(
        JSON.stringify(mockQs),
      );
      const res: any = await service.getExamQuestions('bad');
      expect(res.data).toHaveLength(2);
    });
  });
});

// ================================================================
// KIỂM TRA TOÀN VẸN DỮ LIỆU CÂU HỎI TRONG MOCK (đọc trực tiếp file)
// Tách riêng describe để rõ là kiểm dữ liệu nguồn, không phụ thuộc service.
// ================================================================
describe('Mock questions.json — toàn vẹn nghiệp vụ câu hỏi', () => {
  const mockPath = path.resolve(
    process.cwd(),
    '..',
    'mock-api',
    'questions.json',
  );
  let questions: any[];

  beforeAll(() => {
    const raw = fs.readFileSync(mockPath, 'utf-8');
    questions = JSON.parse(raw).data;
  });

  const keysOf = (q: any) => q.options.map((o: any) => o.key);

  it('file mock có câu hỏi và mỗi câu có options không rỗng', () => {
    expect(questions.length).toBeGreaterThan(0);
    for (const q of questions) {
      expect(Array.isArray(q.options)).toBe(true);
      expect(q.options.length).toBeGreaterThan(0);
      // key của option phải duy nhất
      const keys = keysOf(q);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  it('SINGLE_CHOICE: đúng 1 correctAnswer (chuỗi) và thuộc options', () => {
    const singles = questions.filter((q) => q.type === 'SINGLE_CHOICE');
    expect(singles.length).toBeGreaterThan(0);
    for (const q of singles) {
      expect(typeof q.correctAnswer).toBe('string');
      expect(q.correctAnswer.includes(',')).toBe(false); // chỉ 1 đáp án
      expect(keysOf(q)).toContain(q.correctAnswer);
    }
  });

  it('MULTIPLE_CHOICE: mọi correctAnswer (mảng hoặc "A,C") đều thuộc options và >= 1', () => {
    const multis = questions.filter((q) => q.type === 'MULTIPLE_CHOICE');
    expect(multis.length).toBeGreaterThan(0);
    for (const q of multis) {
      // Hỗ trợ cả 2 biểu diễn: mảng ["A","C"] hoặc chuỗi "A,C"
      const answers = Array.isArray(q.correctAnswer)
        ? q.correctAnswer
        : String(q.correctAnswer)
            .split(',')
            .map((s: string) => s.trim());

      expect(answers.length).toBeGreaterThanOrEqual(1);
      const keys = keysOf(q);
      for (const a of answers) {
        expect(keys).toContain(a);
      }
      // đáp án không trùng lặp
      expect(new Set(answers).size).toBe(answers.length);
    }
  });

  it('TRUE_FALSE: hợp lệ — 2 lựa chọn và correctAnswer thuộc options', () => {
    const tfs = questions.filter((q) => q.type === 'TRUE_FALSE');
    expect(tfs.length).toBeGreaterThan(0);
    for (const q of tfs) {
      expect(q.options.length).toBe(2);
      expect(typeof q.correctAnswer).toBe('string');
      expect(keysOf(q)).toContain(q.correctAnswer);
    }
  });

  it('câu hình ảnh: nếu có mediaUrl thì URL không rỗng và là http(s)', () => {
    const withMedia = questions.filter(
      (q) => q.mediaUrl !== null && q.mediaUrl !== undefined,
    );
    // Mock hiện có ít nhất 1 câu hình ảnh
    expect(withMedia.length).toBeGreaterThan(0);
    for (const q of withMedia) {
      expect(typeof q.mediaUrl).toBe('string');
      expect(q.mediaUrl.trim().length).toBeGreaterThan(0);
      expect(/^https?:\/\//.test(q.mediaUrl)).toBe(true);
    }
  });

  it('mọi câu có type thuộc tập hợp lệ', () => {
    const valid = new Set(['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE']);
    for (const q of questions) {
      expect(valid.has(q.type)).toBe(true);
    }
  });
});
