import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AttemptsService } from './attempts.service';
import { PrismaService } from '../prisma/prisma.service';
import { ExamsService } from '../exams/exams.service';

/**
 * NGHIỆP VỤ — VÒNG ĐỜI BÀI THI (Exam Attempt Lifecycle)
 *
 * Phủ: startExam, saveAnswer, autoSave, getRecovery, checkDevice,
 *      validateAttemptActive (qua saveAnswer/autoSave/submit).
 *
 * PrismaService được mock hoàn toàn. KHÔNG chạm DB thật.
 */
describe('AttemptsService — Exam Lifecycle', () => {
  let service: AttemptsService;
  let prisma: {
    student: { upsert: jest.Mock };
    examAttempt: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      count: jest.Mock;
    };
    examDefinition: { findUnique: jest.Mock };
    sessionExam: { findFirst: jest.Mock };
    attemptQuestion: { createMany: jest.Mock };
    attemptAnswer: {
      upsert: jest.Mock;
      findMany: jest.Mock;
    };
    result: { create: jest.Mock; findUnique: jest.Mock; findMany: jest.Mock };
  };
  let examsService: { getQuestionsWithAnswers: jest.Mock };

  beforeEach(async () => {
    prisma = {
      student: { upsert: jest.fn() },
      examAttempt: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
      },
      examDefinition: { findUnique: jest.fn() },
      sessionExam: { findFirst: jest.fn().mockResolvedValue(null) },
      attemptQuestion: { createMany: jest.fn() },
      attemptAnswer: {
        upsert: jest.fn(),
        findMany: jest.fn(),
      },
      result: { create: jest.fn(), findUnique: jest.fn(), findMany: jest.fn() },
    };
    examsService = { getQuestionsWithAnswers: jest.fn(() => []) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttemptsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ExamsService, useValue: examsService },
      ],
    }).compile();

    service = module.get<AttemptsService>(AttemptsService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // =====================================================================
  // startExam
  // =====================================================================
  describe('startExam', () => {
    const user = { id: 'user-1', email: 'sv@dau.edu.vn', fullName: 'SV Test' };
    const examDefId = 'exam-def-1';

    beforeEach(() => {
      prisma.student.upsert.mockResolvedValue({ id: user.id });
    });

    it('tạo attempt MỚI + resolve Student + snapshot câu hỏi (correctAnswer mảng -> chuỗi)', async () => {
      prisma.examDefinition.findUnique.mockResolvedValue({
        id: examDefId,
        durationMinutes: 90,
      });
      prisma.examAttempt.findFirst.mockResolvedValue(null);
      prisma.examAttempt.create.mockResolvedValue({
        id: 'attempt-new',
        startedAt: new Date(),
        remainingSeconds: 5400,
        status: 'IN_PROGRESS',
      });
      examsService.getQuestionsWithAnswers.mockReturnValue([
        { id: 'q1', type: 'SINGLE_CHOICE', content: 'c1', correctAnswer: 'B' },
        {
          id: 'q2',
          type: 'MULTIPLE_CHOICE',
          content: 'c2',
          correctAnswer: ['A', 'C'],
        },
      ]);
      prisma.attemptQuestion.createMany.mockResolvedValue({ count: 2 });

      const res = await service.startExam(
        user,
        examDefId,
        '10.0.0.1',
        'jest-ua',
      );

      expect(res).toMatchObject({
        attemptId: 'attempt-new',
        remainingSeconds: 5400,
        status: 'IN_PROGRESS',
        recovered: false,
      });
      // resolve Student theo user.id (không placeholder)
      expect(prisma.student.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: user.id } }),
      );
      // BE-007: sessionId KHÔNG còn là placeholder (examId); = null khi chưa gắn
      // ca thi (sessionExam.findFirst -> null trong test), hoặc id ExamSession thật.
      const createArg = prisma.examAttempt.create.mock.calls[0][0].data;
      expect(createArg).toMatchObject({
        studentId: user.id,
        examDefinitionId: examDefId,
        status: 'IN_PROGRESS',
        remainingSeconds: 5400,
        clientIp: '10.0.0.1',
        userAgent: 'jest-ua',
      });
      expect(createArg.sessionId).toBeNull();
      expect(createArg.sessionId).not.toBe(examDefId);
      // snapshot: MULTIPLE_CHOICE correctAnswer mảng -> chuỗi "A,C"
      const snapData = prisma.attemptQuestion.createMany.mock.calls[0][0].data;
      expect(snapData).toHaveLength(2);
      expect(snapData[1].questionSnapshot.correctAnswer).toBe('A,C');
    });

    it('KHÔI PHỤC: trả đúng thời gian còn lại theo server (recovered=true), không tạo mới', async () => {
      prisma.examDefinition.findUnique.mockResolvedValue({
        id: examDefId,
        durationMinutes: 60, // 3600s
      });
      const startedAt = new Date(Date.now() - 120 * 1000); // 120s trước
      prisma.examAttempt.findFirst.mockResolvedValue({
        id: 'attempt-existing',
        status: 'IN_PROGRESS',
        startedAt,
      });

      const res = await service.startExam(user, examDefId);

      expect(res.attemptId).toBe('attempt-existing');
      expect(res.recovered).toBe(true);
      expect(res.remainingSeconds).toBeGreaterThanOrEqual(3475);
      expect(res.remainingSeconds).toBeLessThanOrEqual(3480);
      expect(prisma.examAttempt.create).not.toHaveBeenCalled();
      expect(prisma.attemptQuestion.createMany).not.toHaveBeenCalled();
    });

    it('ném NotFound khi examDefinition không tồn tại', async () => {
      prisma.examDefinition.findUnique.mockResolvedValue(null);

      await expect(service.startExam(user, examDefId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.examAttempt.create).not.toHaveBeenCalled();
    });

    it('KHÔNG snapshot khi đề không có câu hỏi', async () => {
      prisma.examDefinition.findUnique.mockResolvedValue({
        id: examDefId,
        durationMinutes: 60,
      });
      prisma.examAttempt.findFirst.mockResolvedValue(null);
      prisma.examAttempt.create.mockResolvedValue({
        id: 'attempt-x',
        startedAt: new Date(),
        remainingSeconds: 3600,
        status: 'IN_PROGRESS',
      });
      examsService.getQuestionsWithAnswers.mockReturnValue([]);

      await service.startExam(user, examDefId);

      expect(prisma.attemptQuestion.createMany).not.toHaveBeenCalled();
    });

    it('CHẶN khi đã hết số lần thi (Max Attempt) — FR-Q-003', async () => {
      prisma.examDefinition.findUnique.mockResolvedValue({
        id: examDefId,
        durationMinutes: 60,
        maxAttempt: 1,
      });
      prisma.examAttempt.findFirst.mockResolvedValue(null); // không có IN_PROGRESS
      prisma.examAttempt.count.mockResolvedValue(1); // đã thi 1 lần = tối đa

      await expect(service.startExam(user, examDefId)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.examAttempt.create).not.toHaveBeenCalled();
    });

    it('trả về message thân thiện và code khi đã hết số lần thi (maxAttempt=1, finishedCount=1)', async () => {
      prisma.examDefinition.findUnique.mockResolvedValue({
        id: examDefId,
        durationMinutes: 60,
        maxAttempt: 1,
      });
      prisma.examAttempt.findFirst.mockResolvedValue(null);
      prisma.examAttempt.count.mockResolvedValue(1);

      try {
        await service.startExam(user, examDefId);
        fail('Expected startExam to throw BadRequestException');
      } catch (err) {
        expect(err).toBeInstanceOf(BadRequestException);
        const response = (err as BadRequestException).getResponse() as {
          message: string;
          code: string;
        };
        expect(response.message).toBe(
          'Bạn đã hoàn thành bài thi này và đã sử dụng hết số lần thi được phép.',
        );
        expect(response.code).toBe('EXAM_ATTEMPT_LIMIT_REACHED');
      }
      expect(prisma.examAttempt.create).not.toHaveBeenCalled();
    });
  });

  // =====================================================================
  // saveAnswer  (+ validateAttemptActive)
  // =====================================================================
  describe('saveAnswer', () => {
    const attemptId = 'attempt-1';
    const dto = { questionId: 'q-1', answer: 'A' };

    it('upsert đáp án khi attempt IN_PROGRESS', async () => {
      prisma.examAttempt.findUnique.mockResolvedValue({
        id: attemptId,
        status: 'IN_PROGRESS',
      });
      prisma.attemptAnswer.upsert.mockResolvedValue({
        attemptId,
        questionId: 'q-1',
        answerValue: 'A',
      });

      const res = await service.saveAnswer(attemptId, dto);

      expect(res).toMatchObject({ questionId: 'q-1', answerValue: 'A' });
      expect(prisma.attemptAnswer.upsert).toHaveBeenCalledTimes(1);
      const arg = prisma.attemptAnswer.upsert.mock.calls[0][0];
      // khóa upsert là composite attemptId_questionId
      expect(arg.where).toEqual({
        attemptId_questionId: { attemptId, questionId: 'q-1' },
      });
      expect(arg.update.answerValue).toBe('A');
      expect(arg.create).toMatchObject({
        attemptId,
        questionId: 'q-1',
        answerValue: 'A',
      });
    });

    it('CHẶN (BadRequest) khi attempt không IN_PROGRESS (vd SUBMITTED)', async () => {
      prisma.examAttempt.findUnique.mockResolvedValue({
        id: attemptId,
        status: 'SUBMITTED',
      });

      await expect(service.saveAnswer(attemptId, dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.attemptAnswer.upsert).not.toHaveBeenCalled();
    });

    it('ném NotFound khi attempt không tồn tại', async () => {
      prisma.examAttempt.findUnique.mockResolvedValue(null);

      await expect(service.saveAnswer(attemptId, dto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.attemptAnswer.upsert).not.toHaveBeenCalled();
    });
  });

  // =====================================================================
  // autoSave
  // =====================================================================
  describe('autoSave', () => {
    const attemptId = 'attempt-1';

    const makeDto = (n: number) => ({
      answers: Array.from({ length: n }, (_, i) => ({
        questionId: `q-${i}`,
        answer: `ans-${i}`,
        timestamp: '2026-06-12T08:10:00.000Z',
      })),
    });

    it('upsert N đáp án và trả savedCount = N', async () => {
      prisma.examAttempt.findUnique
        // 1) validateAttemptActive
        .mockResolvedValueOnce({ id: attemptId, status: 'IN_PROGRESS' })
        // 2) đọc lại attempt để tính remainingSeconds
        .mockResolvedValueOnce({
          id: attemptId,
          examDefinitionId: 'exam-def-1',
          startedAt: new Date(Date.now() - 60 * 1000), // bắt đầu 60s trước
        });
      prisma.attemptAnswer.upsert.mockResolvedValue({});
      prisma.examDefinition.findUnique.mockResolvedValue({
        durationMinutes: 60,
      });
      prisma.examAttempt.update.mockResolvedValue({});

      const res = await service.autoSave(attemptId, makeDto(3));

      expect(res.savedCount).toBe(3);
      expect(typeof res.savedAt).toBe('string');
      expect(prisma.attemptAnswer.upsert).toHaveBeenCalledTimes(3);
    });

    it('tính remainingSeconds = totalSeconds - elapsed (xấp xỉ, dùng Date.now)', async () => {
      const startedAt = new Date(Date.now() - 120 * 1000); // 120s đã trôi
      prisma.examAttempt.findUnique
        .mockResolvedValueOnce({ id: attemptId, status: 'IN_PROGRESS' })
        .mockResolvedValueOnce({
          id: attemptId,
          examDefinitionId: 'exam-def-1',
          startedAt,
        });
      prisma.attemptAnswer.upsert.mockResolvedValue({});
      prisma.examDefinition.findUnique.mockResolvedValue({
        durationMinutes: 60, // 3600s
      });
      prisma.examAttempt.update.mockResolvedValue({});

      await service.autoSave(attemptId, makeDto(1));

      expect(prisma.examAttempt.update).toHaveBeenCalledTimes(1);
      const updated =
        prisma.examAttempt.update.mock.calls[0][0].data.remainingSeconds;
      // 3600 - ~120 = ~3480; cho dung sai vài giây do thời gian thực thi
      expect(updated).toBeGreaterThanOrEqual(3475);
      expect(updated).toBeLessThanOrEqual(3480);
    });

    it('remainingSeconds KHÔNG bao giờ âm — kẹp về 0 khi đã hết giờ', async () => {
      const startedAt = new Date(Date.now() - 10000 * 1000); // trôi quá xa
      prisma.examAttempt.findUnique
        .mockResolvedValueOnce({ id: attemptId, status: 'IN_PROGRESS' })
        .mockResolvedValueOnce({
          id: attemptId,
          examDefinitionId: 'exam-def-1',
          startedAt,
        });
      prisma.attemptAnswer.upsert.mockResolvedValue({});
      prisma.examDefinition.findUnique.mockResolvedValue({
        durationMinutes: 60,
      });
      prisma.examAttempt.update.mockResolvedValue({});

      await service.autoSave(attemptId, makeDto(1));

      const updated =
        prisma.examAttempt.update.mock.calls[0][0].data.remainingSeconds;
      expect(updated).toBe(0);
    });

    it('fallback durationMinutes=60 khi examDefinition không tìm thấy', async () => {
      const startedAt = new Date(Date.now() - 0 * 1000);
      prisma.examAttempt.findUnique
        .mockResolvedValueOnce({ id: attemptId, status: 'IN_PROGRESS' })
        .mockResolvedValueOnce({
          id: attemptId,
          examDefinitionId: 'exam-def-1',
          startedAt,
        });
      prisma.attemptAnswer.upsert.mockResolvedValue({});
      prisma.examDefinition.findUnique.mockResolvedValue(null); // không có def
      prisma.examAttempt.update.mockResolvedValue({});

      await service.autoSave(attemptId, makeDto(1));

      const updated =
        prisma.examAttempt.update.mock.calls[0][0].data.remainingSeconds;
      // default 60*60 = 3600, elapsed ~0 -> gần 3600
      expect(updated).toBeGreaterThanOrEqual(3595);
      expect(updated).toBeLessThanOrEqual(3600);
    });

    it('CHẶN (BadRequest) khi attempt không active — KHÔNG upsert gì', async () => {
      prisma.examAttempt.findUnique.mockResolvedValueOnce({
        id: attemptId,
        status: 'SUBMITTED',
      });

      await expect(
        service.autoSave(attemptId, makeDto(2)),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.attemptAnswer.upsert).not.toHaveBeenCalled();
      expect(prisma.examAttempt.update).not.toHaveBeenCalled();
    });

    it('ném NotFound khi attempt không tồn tại', async () => {
      prisma.examAttempt.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.autoSave(attemptId, makeDto(1)),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.attemptAnswer.upsert).not.toHaveBeenCalled();
    });

    it('savedCount=0 khi mảng answers rỗng (vẫn cập nhật thời gian)', async () => {
      prisma.examAttempt.findUnique
        .mockResolvedValueOnce({ id: attemptId, status: 'IN_PROGRESS' })
        .mockResolvedValueOnce({
          id: attemptId,
          examDefinitionId: 'exam-def-1',
          startedAt: new Date(),
        });
      prisma.examDefinition.findUnique.mockResolvedValue({
        durationMinutes: 60,
      });
      prisma.examAttempt.update.mockResolvedValue({});

      const res = await service.autoSave(attemptId, { answers: [] });

      expect(res.savedCount).toBe(0);
      expect(prisma.attemptAnswer.upsert).not.toHaveBeenCalled();
    });
  });

  // =====================================================================
  // getRecovery
  // =====================================================================
  describe('getRecovery', () => {
    const attemptId = 'attempt-1';

    it('trả về snapshot phục hồi (status, remainingSeconds, answers, questions)', async () => {
      const startedAt = new Date('2026-06-12T08:00:00.000Z');
      prisma.examAttempt.findUnique.mockResolvedValue({
        id: attemptId,
        status: 'IN_PROGRESS',
        startedAt,
        remainingSeconds: 1800,
        answers: [{ questionId: 'q-1', answerValue: 'A' }],
        questions: [{ id: 'q-1' }],
      });

      const res = await service.getRecovery(attemptId);

      expect(res).toEqual({
        attemptId,
        status: 'IN_PROGRESS',
        startedAt,
        remainingSeconds: 1800,
        answers: [{ questionId: 'q-1', answerValue: 'A' }],
        questions: [{ id: 'q-1' }],
      });
      // phải include cả answers và questions
      const arg = prisma.examAttempt.findUnique.mock.calls[0][0];
      expect(arg.include).toEqual({ answers: true, questions: true });
    });

    it('ném NotFound khi attempt không tồn tại', async () => {
      prisma.examAttempt.findUnique.mockResolvedValue(null);

      await expect(service.getRecovery(attemptId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  // =====================================================================
  // checkDevice — passed = AND của 3 cờ (mọi tổ hợp)
  // =====================================================================
  describe('checkDevice', () => {
    const examId = 'exam-1';
    const combos: Array<[boolean, boolean, boolean, boolean]> = [
      [true, true, true, true],
      [true, true, false, false],
      [true, false, true, false],
      [false, true, true, false],
      [true, false, false, false],
      [false, true, false, false],
      [false, false, true, false],
      [false, false, false, false],
    ];

    it.each(combos)(
      'browser=%s audio=%s ping=%s -> passed=%s',
      async (browserCompatible, audioFunctional, pingStable, expected) => {
        const res = await service.checkDevice(examId, {
          browserCompatible,
          audioFunctional,
          pingStable,
        });

        expect(res.passed).toBe(expected);
        expect(res.checks).toEqual({
          browserCompatible,
          audioFunctional,
          pingStable,
        });
      },
    );
  });
});
