import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AttemptsService } from './attempts.service';
import { PrismaService } from '../prisma/prisma.service';
import { ExamsService } from '../exams/exams.service';

/**
 * EPIC-18 — Công bố kết quả (Result Management).
 * FR-L-001 / AC-026: SV chỉ xem kết quả KHI đã công bố; ADMIN/EXAM_OFFICER xem mọi lúc.
 * UC-046/047: công bố / ẩn kết quả của một đề thi.
 */

function buildPrisma(result: any) {
  return {
    result: {
      findUnique: jest.fn(async () => result),
      findMany: jest.fn(async () => [result].filter(Boolean)),
      updateMany: jest.fn(async () => ({ count: 3 })),
    },
  } as any;
}

async function makeService(prisma: any): Promise<AttemptsService> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      AttemptsService,
      { provide: PrismaService, useValue: prisma },
      {
        provide: ExamsService,
        useValue: { getQuestionsWithAnswers: jest.fn(() => []) },
      },
    ],
  }).compile();
  return module.get<AttemptsService>(AttemptsService);
}

const baseResult = {
  attemptId: 'attempt-1',
  studentId: 'student-1',
  examDefinitionId: 'examdef-1',
  score: 8,
  published: false,
  publishedAt: null,
};

describe('AttemptsService — Result publish (EPIC-18)', () => {
  describe('getResult — kiểm soát hiển thị theo published', () => {
    it('SV xem kết quả CHƯA công bố => ForbiddenException', async () => {
      const service = await makeService(
        buildPrisma({ ...baseResult, published: false }),
      );
      await expect(
        service.getResult('attempt-1', ['STUDENT']),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('SV xem kết quả ĐÃ công bố => trả về kết quả', async () => {
      const service = await makeService(
        buildPrisma({ ...baseResult, published: true }),
      );
      const res = await service.getResult('attempt-1', ['STUDENT']);
      expect(res.score).toBe(8);
    });

    it('EXAM_OFFICER xem kết quả chưa công bố => vẫn trả về', async () => {
      const service = await makeService(
        buildPrisma({ ...baseResult, published: false }),
      );
      const res = await service.getResult('attempt-1', ['EXAM_OFFICER']);
      expect(res.attemptId).toBe('attempt-1');
    });

    it('ADMIN xem kết quả chưa công bố => vẫn trả về', async () => {
      const service = await makeService(
        buildPrisma({ ...baseResult, published: false }),
      );
      const res = await service.getResult('attempt-1', ['ADMIN']);
      expect(res.attemptId).toBe('attempt-1');
    });

    it('không có kết quả => NotFoundException', async () => {
      const service = await makeService(buildPrisma(null));
      await expect(
        service.getResult('missing', ['ADMIN']),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('không truyền roles (mặc định) + chưa công bố => Forbidden', async () => {
      const service = await makeService(
        buildPrisma({ ...baseResult, published: false }),
      );
      await expect(service.getResult('attempt-1')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });

  describe('getStudentResults — chỉ kết quả đã công bố', () => {
    it('query lọc published: true', async () => {
      const prisma = buildPrisma({ ...baseResult, published: true });
      const service = await makeService(prisma);
      await service.getStudentResults('student-1');
      expect(prisma.result.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { studentId: 'student-1', published: true },
        }),
      );
    });
  });

  describe('publishResults / unpublishResults (UC-046/047)', () => {
    it('publishResults set published=true + publishedAt, trả số lượng', async () => {
      const prisma = buildPrisma(baseResult);
      const service = await makeService(prisma);
      const res = await service.publishResults('examdef-1');
      expect(res).toEqual({ published: 3 });
      expect(prisma.result.updateMany).toHaveBeenCalledWith({
        where: { examDefinitionId: 'examdef-1' },
        data: expect.objectContaining({
          published: true,
          publishedAt: expect.any(Date),
        }),
      });
    });

    it('unpublishResults set published=false + publishedAt=null', async () => {
      const prisma = buildPrisma(baseResult);
      const service = await makeService(prisma);
      const res = await service.unpublishResults('examdef-1');
      expect(res).toEqual({ unpublished: 3 });
      expect(prisma.result.updateMany).toHaveBeenCalledWith({
        where: { examDefinitionId: 'examdef-1' },
        data: { published: false, publishedAt: null },
      });
    });
  });

  describe('getAttemptReview — chi tiết thật (EPIC-18)', () => {
    function buildReviewPrisma(published: boolean, showResult = true) {
      return {
        result: {
          findUnique: jest.fn(async () => ({
            ...baseResult,
            published,
            score: 5,
          })),
        },
        examDefinition: {
          findUnique: jest.fn(async () => ({ showResult })),
        },
        attemptQuestion: {
          findMany: jest.fn(async () => [
            {
              questionId: 'q1',
              questionOrder: 0,
              questionContent: 'c1',
              questionType: 'SINGLE_CHOICE',
              questionSnapshot: { type: 'SINGLE_CHOICE', correctAnswer: 'B' },
            },
            {
              questionId: 'q2',
              questionOrder: 1,
              questionContent: 'c2',
              questionType: 'SINGLE_CHOICE',
              questionSnapshot: { type: 'SINGLE_CHOICE', correctAnswer: 'A' },
            },
          ]),
        },
        attemptAnswer: {
          findMany: jest.fn(async () => [
            { questionId: 'q1', answerValue: 'B' },
          ]),
        },
      } as any;
    }

    it('trả review thật (đúng/sai/bỏ trống) khi đã công bố', async () => {
      const service = await makeService(buildReviewPrisma(true));
      const res: any = await service.getAttemptReview('attempt-1', ['STUDENT']);
      expect(res.result.score).toBe(5);
      expect(res.review).toHaveLength(2);
      expect(res.review[0].status).toBe('correct'); // q1: B == B
      expect(res.review[1].status).toBe('skipped'); // q2: không trả lời
      expect(res.summary).toEqual({ total: 2, answered: 1, skipped: 1 });
    });

    it('SV xem điểm NGAY khi showResult=true (không cần công bố)', async () => {
      // published=false nhưng showResult=true -> vẫn trả điểm ngay (FR-L-003).
      const service = await makeService(buildReviewPrisma(false, true));
      const res: any = await service.getAttemptReview('attempt-1', ['STUDENT']);
      expect(res.showResult).toBe(true);
      expect(res.result.score).toBe(5);
      expect(res.review).toHaveLength(2);
    });

    it('đề KHÔNG cho xem điểm (showResult=false) => giấu điểm + đáp án (FR-L-003)', async () => {
      const service = await makeService(buildReviewPrisma(true, false));
      const res: any = await service.getAttemptReview('attempt-1', ['STUDENT']);
      expect(res.showResult).toBe(false);
      expect(res.result).toBeNull();
      expect(res.review).toEqual([]);
      // vẫn cho biết tiến độ (đã làm/ tổng) nhưng KHÔNG có điểm
      expect(res.summary.total).toBe(2);
    });
  });
});
