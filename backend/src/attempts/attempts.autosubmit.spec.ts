import { Test, TestingModule } from '@nestjs/testing';
import { AttemptsService } from './attempts.service';
import { PrismaService } from '../prisma/prisma.service';
import { ExamsService } from '../exams/exams.service';

/**
 * US-074 — Tự động nộp bài khi hết thời gian.
 * Kiểm thử AttemptsService.autoSubmitExpired(now): chỉ nộp các attempt IN_PROGRESS
 * đã hết giờ (elapsed >= durationMinutes*60), bỏ qua các bài còn thời gian.
 */

const MIN = 60 * 1000;

function buildPrismaMock(attempts: any[], durationMinutes = 60) {
  const store = attempts.map((a) => ({ ...a }));
  return {
    examAttempt: {
      findMany: jest.fn(async () =>
        store.filter((a) => a.status === 'IN_PROGRESS'),
      ),
      findUnique: jest.fn(
        async ({ where }: any) => store.find((a) => a.id === where.id) ?? null,
      ),
      update: jest.fn(async ({ where, data }: any) => {
        const a = store.find((x) => x.id === where.id);
        Object.assign(a, data);
        return a;
      }),
    },
    attemptQuestion: { findMany: jest.fn(async () => []) },
    attemptAnswer: { findMany: jest.fn(async () => []) },
    examDefinition: {
      findUnique: jest.fn(async () => ({ durationMinutes })),
    },
    result: {
      create: jest.fn(async ({ data }: any) => ({ id: 'r', ...data })),
      upsert: jest.fn(async ({ create }: any) => ({ id: 'r', ...create })),
    },
    _store: store,
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

describe('AttemptsService.autoSubmitExpired (US-074)', () => {
  const now = new Date('2026-06-12T10:00:00.000Z');

  it('nộp bài đã hết giờ (61 phút / đề 60 phút)', async () => {
    const prisma = buildPrismaMock([
      {
        id: 'A',
        studentId: 's1',
        examDefinitionId: 'e1',
        status: 'IN_PROGRESS',
        startedAt: new Date(now.getTime() - 61 * MIN),
      },
    ]);
    const service = await makeService(prisma);

    const res = await service.autoSubmitExpired(now);

    expect(res.submitted).toBe(1);
    expect(prisma.result.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.examAttempt.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'A' },
        data: expect.objectContaining({
          status: 'SUBMITTED',
          remainingSeconds: 0,
        }),
      }),
    );
  });

  it('KHÔNG nộp bài còn thời gian (10 phút / đề 60 phút)', async () => {
    const prisma = buildPrismaMock([
      {
        id: 'B',
        studentId: 's1',
        examDefinitionId: 'e1',
        status: 'IN_PROGRESS',
        startedAt: new Date(now.getTime() - 10 * MIN),
      },
    ]);
    const service = await makeService(prisma);

    const res = await service.autoSubmitExpired(now);

    expect(res.submitted).toBe(0);
    expect(prisma.result.upsert).not.toHaveBeenCalled();
  });

  it('chỉ nộp các bài hết giờ trong tập hỗn hợp', async () => {
    const prisma = buildPrismaMock([
      {
        id: 'A',
        studentId: 's',
        examDefinitionId: 'e',
        status: 'IN_PROGRESS',
        startedAt: new Date(now.getTime() - 90 * MIN),
      },
      {
        id: 'B',
        studentId: 's',
        examDefinitionId: 'e',
        status: 'IN_PROGRESS',
        startedAt: new Date(now.getTime() - 5 * MIN),
      },
      {
        id: 'C',
        studentId: 's',
        examDefinitionId: 'e',
        status: 'SUBMITTED',
        startedAt: new Date(now.getTime() - 99 * MIN),
      },
    ]);
    const service = await makeService(prisma);

    const res = await service.autoSubmitExpired(now);

    // A hết giờ -> nộp; B còn giờ; C đã SUBMITTED nên không nằm trong findMany IN_PROGRESS.
    expect(res.submitted).toBe(1);
  });

  it('đúng mốc biên (elapsed == duration) vẫn nộp', async () => {
    const prisma = buildPrismaMock([
      {
        id: 'A',
        studentId: 's',
        examDefinitionId: 'e',
        status: 'IN_PROGRESS',
        startedAt: new Date(now.getTime() - 60 * MIN),
      },
    ]);
    const service = await makeService(prisma);

    const res = await service.autoSubmitExpired(now);

    expect(res.submitted).toBe(1);
  });

  it('bỏ qua attempt không có startedAt', async () => {
    const prisma = buildPrismaMock([
      {
        id: 'A',
        studentId: 's',
        examDefinitionId: 'e',
        status: 'IN_PROGRESS',
        startedAt: null,
      },
    ]);
    const service = await makeService(prisma);

    const res = await service.autoSubmitExpired(now);

    expect(res.submitted).toBe(0);
  });

  it('không vỡ khi submit ném lỗi giữa chừng (catch + log warn)', async () => {
    const prisma = buildPrismaMock([
      {
        id: 'A',
        studentId: 's',
        examDefinitionId: 'e',
        status: 'IN_PROGRESS',
        startedAt: new Date(now.getTime() - 99 * MIN),
      },
    ]);
    // Ép submit() thất bại: validateAttemptActive gọi findUnique -> null -> NotFound.
    prisma.examAttempt.findUnique = jest.fn(async () => null);
    const service = await makeService(prisma);

    const res = await service.autoSubmitExpired(now);

    expect(res.submitted).toBe(0);
  });

  it('handleAutoSubmitExpired() (cron mỗi phút) chạy không lỗi', async () => {
    const prisma = buildPrismaMock([]);
    const service = await makeService(prisma);

    await expect(service.handleAutoSubmitExpired()).resolves.toBeUndefined();
    expect(prisma.examAttempt.findMany).toHaveBeenCalled();
  });
});
