import { Test, TestingModule } from '@nestjs/testing';
import { AttemptsService } from './attempts.service';
import { PrismaService } from '../prisma/prisma.service';
import { ExamsService } from '../exams/exams.service';

/**
 * Tự luận (ESSAY) — chấm TAY: gradeEssay lưu manualCredit + chấm lại; điểm phản
 * ánh điểm tay; listEssayAnswers trả bài cần chấm.
 */
function buildPrisma() {
  const attempt = {
    id: 'att-1',
    studentId: 'sv-1',
    examDefinitionId: 'ex-1',
    status: 'SUBMITTED',
    submittedAt: new Date(),
    student: { fullName: 'Lý Ngọc Vy', studentCode: 'SV2110' },
  };
  // 2 câu: 1 trắc nghiệm đúng + 1 tự luận
  const questions = [
    {
      attemptId: 'att-1',
      questionId: 'q1',
      questionOrder: 0,
      questionType: 'SINGLE_CHOICE',
      questionContent: 'Câu TN',
      questionSnapshot: { type: 'SINGLE_CHOICE', correctAnswer: 'B' },
    },
    {
      attemptId: 'att-1',
      questionId: 'q2',
      questionOrder: 1,
      questionType: 'ESSAY',
      questionContent: 'Trình bày...',
      questionSnapshot: { type: 'ESSAY', correctAnswer: '' },
    },
  ];
  const answers: any[] = [
    {
      attemptId: 'att-1',
      questionId: 'q1',
      answerValue: 'B',
      manualCredit: null,
    },
    {
      attemptId: 'att-1',
      questionId: 'q2',
      answerValue: 'Bài làm tự luận của em…',
      manualCredit: null,
    },
  ];
  let result: any = null;
  return {
    _result: () => result,
    examAttempt: {
      findUnique: jest.fn(async () => attempt),
      findMany: jest.fn(async () => [attempt]),
    },
    attemptQuestion: {
      findMany: jest.fn(async ({ where }: any) =>
        where?.questionType
          ? questions.filter((q) => q.questionType === where.questionType)
          : questions,
      ),
      count: jest.fn(async () => questions.length),
    },
    attemptAnswer: {
      findMany: jest.fn(async () => answers),
      upsert: jest.fn(async ({ where, update }: any) => {
        const a = answers.find(
          (x) => x.questionId === where.attemptId_questionId.questionId,
        );
        if (a) Object.assign(a, update);
        return a;
      }),
    },
    result: {
      upsert: jest.fn(async ({ create, update }: any) => {
        result = result ? { ...result, ...update } : { id: 'r', ...create };
        return result;
      }),
      findUnique: jest.fn(async () => ({
        score: 8.5,
        correctAnswers: 1,
        totalQuestions: 2,
        published: false,
      })),
    },
  } as any;
}

async function makeService(prisma: any): Promise<AttemptsService> {
  const mod: TestingModule = await Test.createTestingModule({
    providers: [
      AttemptsService,
      { provide: PrismaService, useValue: prisma },
      {
        provide: ExamsService,
        useValue: { getQuestionsWithAnswers: jest.fn() },
      },
    ],
  }).compile();
  return mod.get(AttemptsService);
}

describe('AttemptsService — chấm tự luận', () => {
  it('gradeEssay lưu manualCredit + chấm lại (điểm tăng)', async () => {
    const prisma = buildPrisma();
    const svc = await makeService(prisma);

    await svc.gradeEssay('att-1', 'q2', 1);

    // đã lưu điểm tay cho câu tự luận
    expect(prisma.attemptAnswer.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: { manualCredit: 1 },
      }),
    );
    // 2/2 đúng (TN đúng + tự luận chấm 1) => điểm 10
    expect(prisma._result().correctAnswers).toBe(2);
    expect(prisma._result().score).toBe(10);
  });

  it('clamp điểm về [0,1]', async () => {
    const prisma = buildPrisma();
    const svc = await makeService(prisma);
    const r = await svc.gradeEssay('att-1', 'q2', 5);
    expect(r.manualCredit).toBe(1);
  });

  it('listEssayAnswers trả bài tự luận kèm tên SV + nội dung', async () => {
    const prisma = buildPrisma();
    const svc = await makeService(prisma);
    const list = await svc.listEssayAnswers('ex-1');
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({
      studentName: 'Lý Ngọc Vy',
      studentCode: 'SV2110',
    });
    expect(list[0].essays[0]).toMatchObject({
      questionId: 'q2',
      content: 'Trình bày...',
      answer: 'Bài làm tự luận của em…',
    });
  });

  it('listAttempts trả mỗi SV kèm số câu trả lời + điểm + trạng thái', async () => {
    const prisma = buildPrisma();
    const svc = await makeService(prisma);
    const list = await svc.listAttempts('ex-1');
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({
      attemptId: 'att-1',
      studentName: 'Lý Ngọc Vy',
      studentCode: 'SV2110',
      status: 'SUBMITTED',
      answeredCount: 2, // cả 2 câu đều có đáp án
      totalQuestions: 2,
      score: 8.5,
      correctAnswers: 1,
      published: false,
    });
  });
});
