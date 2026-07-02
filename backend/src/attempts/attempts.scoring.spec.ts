import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AttemptsService } from './attempts.service';
import { PrismaService } from '../prisma/prisma.service';
import { ExamsService } from '../exams/exams.service';

/**
 * BUSINESS-LOGIC SCORING TESTS for the DAU Examination System.
 *
 * These tests encode the CORRECT expected grading behaviour, not the current
 * (possibly buggy) implementation. They are intentionally strict: if the system
 * does not auto-grade answers against the question's correctAnswer at submit
 * time, the score assertions will FAIL — and that FAILURE is the evidence of a
 * scoring vulnerability, NOT a reason to weaken the test.
 *
 * Scoring rules under test:
 *  - SINGLE_CHOICE  : answerValue == correctAnswer (case-insensitive, trimmed).
 *  - MULTIPLE_CHOICE: set("A,C") == set("C,A); order-independent; no missing/extra.
 *  - TRUE_FALSE     : answerValue == correctAnswer.
 *  - Image questions (mediaUrl != null) are graded the same way via correctAnswer.
 *  - Unanswered / null answerValue => wrong.
 *  - submit(): score = round((correctAnswers / totalQuestions) * 10), wrongAnswers,
 *    status SUBMITTED, remainingSeconds 0, Result row created.
 *  - submit()/saveAnswer() reject when attempt is not IN_PROGRESS.
 */

// ---------------------------------------------------------------------------
// Reference grading oracle: what the system *should* compute for a single
// answer given the question's correctAnswer and type. Used only inside the
// Prisma mock to simulate a correctly-grading backend so we can assert that
// submit() reflects grading. The production submit() does NOT use this — it
// only reads AttemptAnswer.isCorrect. So whether these tests pass depends
// entirely on whether the production code sets isCorrect.
// ---------------------------------------------------------------------------
function gradeAnswer(
  type: string,
  correctAnswer: string,
  answerValue: string | null | undefined,
): boolean {
  if (
    answerValue === null ||
    answerValue === undefined ||
    answerValue.trim() === ''
  ) {
    return false;
  }
  const norm = (s: string) => s.trim().toUpperCase();
  if (type === 'MULTIPLE_CHOICE') {
    const expected = correctAnswer.split(',').map(norm).sort();
    const given = answerValue.split(',').map(norm).sort();
    return (
      expected.length === given.length &&
      expected.every((v, i) => v === given[i])
    );
  }
  // SINGLE_CHOICE, TRUE_FALSE, image-based single answer
  return norm(correctAnswer) === norm(answerValue);
}

// Build a Prisma mock whose stored answers carry the *correct* isCorrect flag,
// computed from the question snapshots. If production grading worked, submit()
// would read these and produce a correct score. This isolates the question to:
// "does production code ever populate isCorrect?" — which it must, for the
// score to be non-zero.
type QSnap = {
  questionId: string;
  type: string;
  correctAnswer: string;
  mediaUrl?: string | null;
  gradingMode?: 'ALL_OR_NOTHING' | 'PARTIAL';
};

function buildPrismaMock(opts: {
  attempt: any;
  questions: QSnap[];
  rawAnswers: { questionId: string; answerValue: string | null }[];
}) {
  const { attempt, questions, rawAnswers } = opts;

  // Persisted answers as production code would have saved them: answerValue set,
  // isCorrect left as whatever production grading produced. We simulate the
  // *current production reality*: saveAnswer/autoSave never set isCorrect, so it
  // is undefined here unless production set it. To detect the bug we store the
  // answers exactly as the service layer would (answerValue only). The grading
  // oracle is exposed via the snapshots so a corrected implementation could use it.
  const storedAnswers = rawAnswers.map((a) => {
    const q = questions.find((qq) => qq.questionId === a.questionId);
    return {
      id: `ans-${a.questionId}`,
      attemptId: attempt.id,
      questionId: a.questionId,
      answerValue: a.answerValue,
      // NOTE: deliberately reflect production behaviour. The service's
      // saveAnswer/autoSave never compute this. We leave it undefined to mirror
      // the real DB state. A correct implementation would compute it at save or
      // submit time using the snapshot's correctAnswer.
      isCorrect: undefined as boolean | undefined,
      // expose oracle truth for assertions/debugging only:
      _expectedCorrect: q
        ? gradeAnswer(q.type, q.correctAnswer, a.answerValue)
        : false,
    };
  });

  const attemptQuestions = questions.map((q, i) => ({
    id: `aq-${q.questionId}`,
    attemptId: attempt.id,
    questionId: q.questionId,
    questionOrder: i,
    questionType: q.type,
    questionSnapshot: {
      correctAnswer: q.correctAnswer,
      type: q.type,
      mediaUrl: q.mediaUrl ?? null,
      gradingMode: q.gradingMode ?? 'ALL_OR_NOTHING',
    },
  }));

  let createdResult: any = null;
  const currentAttempt = { ...attempt };

  return {
    _state: {
      get createdResult() {
        return createdResult;
      },
      currentAttempt,
      storedAnswers,
    },
    examAttempt: {
      findUnique: jest.fn(async () => ({
        ...currentAttempt,
        answers: storedAnswers,
        questions: attemptQuestions,
      })),
      findFirst: jest.fn(async () => ({
        ...currentAttempt,
        answers: storedAnswers,
      })),
      update: jest.fn(async ({ data }: any) => {
        Object.assign(currentAttempt, data);
        return {
          ...currentAttempt,
          answers: storedAnswers,
          questions: attemptQuestions,
        };
      }),
      create: jest.fn(async ({ data }: any) => ({
        id: 'new-attempt',
        ...data,
      })),
    },
    attemptAnswer: {
      findMany: jest.fn(async () => storedAnswers),
      upsert: jest.fn(async ({ create }: any) => ({ id: 'ans-x', ...create })),
    },
    attemptQuestion: {
      findMany: jest.fn(async () => attemptQuestions),
    },
    examDefinition: {
      findUnique: jest.fn(async () => ({
        id: attempt.examDefinitionId,
        durationMinutes: 60,
      })),
    },
    result: {
      create: jest.fn(async ({ data }: any) => {
        createdResult = { id: 'result-1', ...data };
        return createdResult;
      }),
      upsert: jest.fn(async ({ create }: any) => {
        createdResult = { id: 'result-1', ...create };
        return createdResult;
      }),
      findUnique: jest.fn(async () => createdResult),
    },
  };
}

const baseAttempt = {
  id: 'attempt-1',
  studentId: 'student-1',
  sessionId: 'session-1',
  examDefinitionId: 'examdef-1',
  status: 'IN_PROGRESS',
  startedAt: new Date(),
  submittedAt: null,
  remainingSeconds: 3600,
};

async function makeService(prismaMock: any): Promise<AttemptsService> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      AttemptsService,
      { provide: PrismaService, useValue: prismaMock },
      {
        provide: ExamsService,
        useValue: { getQuestionsWithAnswers: jest.fn(() => []) },
      },
    ],
  }).compile();
  return module.get<AttemptsService>(AttemptsService);
}

describe('AttemptsService - Scoring & Submit (business logic)', () => {
  // -------------------------------------------------------------------------
  // The grading ORACLE itself (sanity checks that our expectations are right).
  // These do not touch production code and should always pass.
  // -------------------------------------------------------------------------
  describe('grading rules (specification oracle)', () => {
    it('SINGLE_CHOICE: correct selection is correct', () => {
      expect(gradeAnswer('SINGLE_CHOICE', 'B', 'B')).toBe(true);
    });
    it('SINGLE_CHOICE: wrong selection is wrong', () => {
      expect(gradeAnswer('SINGLE_CHOICE', 'B', 'A')).toBe(false);
    });
    it('MULTIPLE_CHOICE: exact set "A,C" is correct', () => {
      expect(gradeAnswer('MULTIPLE_CHOICE', 'A,C', 'A,C')).toBe(true);
    });
    it('MULTIPLE_CHOICE: different order "C,A" is still correct', () => {
      expect(gradeAnswer('MULTIPLE_CHOICE', 'A,C', 'C,A')).toBe(true);
    });
    it('MULTIPLE_CHOICE: missing one option is wrong', () => {
      expect(gradeAnswer('MULTIPLE_CHOICE', 'A,C', 'A')).toBe(false);
    });
    it('MULTIPLE_CHOICE: extra option is wrong', () => {
      expect(gradeAnswer('MULTIPLE_CHOICE', 'A,C', 'A,B,C')).toBe(false);
    });
    it('TRUE_FALSE: matching value is correct', () => {
      expect(gradeAnswer('TRUE_FALSE', 'TRUE', 'true')).toBe(true);
    });
    it('TRUE_FALSE: opposite value is wrong', () => {
      expect(gradeAnswer('TRUE_FALSE', 'TRUE', 'FALSE')).toBe(false);
    });
    it('unanswered (null/empty) is wrong', () => {
      expect(gradeAnswer('SINGLE_CHOICE', 'B', null)).toBe(false);
      expect(gradeAnswer('SINGLE_CHOICE', 'B', '')).toBe(false);
    });
    it('image-based question graded by correctAnswer', () => {
      expect(gradeAnswer('SINGLE_CHOICE', 'D', 'D')).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // submit() — end-to-end scoring expectations against PRODUCTION code.
  // These are the tests that expose the missing auto-grading.
  // -------------------------------------------------------------------------
  describe('submit() scoring', () => {
    it('all answers correct => score 10, correctAnswers=total, wrongAnswers=0', async () => {
      const questions: QSnap[] = [
        { questionId: 'q1', type: 'SINGLE_CHOICE', correctAnswer: 'B' },
        { questionId: 'q2', type: 'MULTIPLE_CHOICE', correctAnswer: 'A,C' },
        { questionId: 'q3', type: 'TRUE_FALSE', correctAnswer: 'TRUE' },
        {
          questionId: 'q4',
          type: 'SINGLE_CHOICE',
          correctAnswer: 'D',
          mediaUrl: 'http://img/x.png',
        },
      ];
      const prisma = buildPrismaMock({
        attempt: baseAttempt,
        questions,
        rawAnswers: [
          { questionId: 'q1', answerValue: 'B' },
          { questionId: 'q2', answerValue: 'C,A' }, // order swapped, still correct
          { questionId: 'q3', answerValue: 'TRUE' },
          { questionId: 'q4', answerValue: 'D' }, // image question
        ],
      });
      const service = await makeService(prisma);

      await service.submit('attempt-1');

      const result = prisma.result.upsert.mock.calls[0][0].create;
      expect(result.totalQuestions).toBe(4);
      expect(result.correctAnswers).toBe(4);
      expect(result.wrongAnswers).toBe(0);
      expect(result.score).toBe(10);
    });

    it('FILL_BLANK + NUMERIC: chấm theo khớp text / so sánh số', async () => {
      const questions: QSnap[] = [
        {
          questionId: 'q1',
          type: 'FILL_BLANK',
          correctAnswer: 'Hà Nội|Ha Noi',
        },
        { questionId: 'q2', type: 'NUMERIC', correctAnswer: '20' },
        { questionId: 'q3', type: 'FILL_BLANK', correctAnswer: '1/x' },
      ];
      const prisma = buildPrismaMock({
        attempt: baseAttempt,
        questions,
        rawAnswers: [
          { questionId: 'q1', answerValue: 'ha noi' }, // khớp (không phân biệt hoa)
          { questionId: 'q2', answerValue: '20,0' }, // 20.0 == 20 (số)
          { questionId: 'q3', answerValue: '2x' }, // sai
        ],
      });
      const service = await makeService(prisma);

      await service.submit('attempt-1');

      const result = prisma.result.upsert.mock.calls[0][0].create;
      expect(result.correctAnswers).toBe(2);
      expect(result.wrongAnswers).toBe(1);
    });

    it('MATCHING/CLASSIFY: chấm theo tỉ lệ gán đúng (partial)', async () => {
      const questions: QSnap[] = [
        { questionId: 'q1', type: 'MATCHING', correctAnswer: 'I1:T2,I2:T1' },
        { questionId: 'q2', type: 'CLASSIFY', correctAnswer: 'I1:T1,I2:T1' },
      ];
      const prisma = buildPrismaMock({
        attempt: baseAttempt,
        questions,
        rawAnswers: [
          { questionId: 'q1', answerValue: 'I1:T2,I2:T2' }, // 1/2 đúng -> 0.5
          { questionId: 'q2', answerValue: 'I1:T1,I2:T1' }, // 2/2 đúng -> 1
        ],
      });
      const service = await makeService(prisma);

      await service.submit('attempt-1');

      const result = prisma.result.upsert.mock.calls[0][0].create;
      expect(result.correctAnswers).toBe(1); // chỉ q2 credit===1
      expect(result.score).toBe(7.5); // (0.5+1)/2*10
    });

    it('HOTSPOT: click trúng vùng = đúng; click trượt bị trừ', async () => {
      const questions: QSnap[] = [
        // 2 vùng đúng
        {
          questionId: 'q1',
          type: 'HOTSPOT',
          correctAnswer: '0.1,0.2,0.3,0.4;0.5,0.6,0.7,0.8',
        },
        // 1 vùng đúng
        { questionId: 'q2', type: 'HOTSPOT', correctAnswer: '0.1,0.2,0.3,0.4' },
      ];
      const prisma = buildPrismaMock({
        attempt: baseAttempt,
        questions,
        rawAnswers: [
          { questionId: 'q1', answerValue: '0.2,0.3;0.6,0.7' }, // trúng cả 2 -> 1
          { questionId: 'q2', answerValue: '0.9,0.9' }, // trượt -> 0
        ],
      });
      const service = await makeService(prisma);

      await service.submit('attempt-1');

      const result = prisma.result.upsert.mock.calls[0][0].create;
      expect(result.correctAnswers).toBe(1); // chỉ q1 credit===1
      expect(result.score).toBe(5); // (1+0)/2*10
    });

    it('student answers SINGLE_CHOICE correctly then submits => score MUST be > 0', async () => {
      // This is the core vulnerability probe. If auto-grading is missing,
      // correctAnswers stays 0 and this assertion FAILS.
      const prisma = buildPrismaMock({
        attempt: baseAttempt,
        questions: [
          { questionId: 'q1', type: 'SINGLE_CHOICE', correctAnswer: 'B' },
        ],
        rawAnswers: [{ questionId: 'q1', answerValue: 'B' }],
      });
      const service = await makeService(prisma);

      await service.submit('attempt-1');

      const result = prisma.result.upsert.mock.calls[0][0].create;
      expect(result.correctAnswers).toBe(1);
      expect(result.score).toBeGreaterThan(0);
    });

    it('partial correctness => proportional score (2/4 correct => 5)', async () => {
      const questions: QSnap[] = [
        { questionId: 'q1', type: 'SINGLE_CHOICE', correctAnswer: 'B' },
        { questionId: 'q2', type: 'MULTIPLE_CHOICE', correctAnswer: 'A,C' },
        { questionId: 'q3', type: 'TRUE_FALSE', correctAnswer: 'TRUE' },
        { questionId: 'q4', type: 'SINGLE_CHOICE', correctAnswer: 'D' },
      ];
      const prisma = buildPrismaMock({
        attempt: baseAttempt,
        questions,
        rawAnswers: [
          { questionId: 'q1', answerValue: 'B' }, // correct
          { questionId: 'q2', answerValue: 'A' }, // missing C => wrong
          { questionId: 'q3', answerValue: 'TRUE' }, // correct
          { questionId: 'q4', answerValue: 'A' }, // wrong
        ],
      });
      const service = await makeService(prisma);

      await service.submit('attempt-1');

      const result = prisma.result.upsert.mock.calls[0][0].create;
      expect(result.correctAnswers).toBe(2);
      expect(result.wrongAnswers).toBe(2);
      expect(result.score).toBe(5);
    });

    it('all answers wrong => score 0, correctAnswers 0', async () => {
      const prisma = buildPrismaMock({
        attempt: baseAttempt,
        questions: [
          { questionId: 'q1', type: 'SINGLE_CHOICE', correctAnswer: 'B' },
          { questionId: 'q2', type: 'TRUE_FALSE', correctAnswer: 'TRUE' },
        ],
        rawAnswers: [
          { questionId: 'q1', answerValue: 'A' },
          { questionId: 'q2', answerValue: 'FALSE' },
        ],
      });
      const service = await makeService(prisma);

      await service.submit('attempt-1');

      const result = prisma.result.upsert.mock.calls[0][0].create;
      expect(result.correctAnswers).toBe(0);
      expect(result.score).toBe(0);
    });

    it('unanswered question counts as wrong', async () => {
      const prisma = buildPrismaMock({
        attempt: baseAttempt,
        questions: [
          { questionId: 'q1', type: 'SINGLE_CHOICE', correctAnswer: 'B' },
          { questionId: 'q2', type: 'SINGLE_CHOICE', correctAnswer: 'A' },
        ],
        rawAnswers: [
          { questionId: 'q1', answerValue: 'B' }, // correct
          { questionId: 'q2', answerValue: null }, // blank => wrong
        ],
      });
      const service = await makeService(prisma);

      await service.submit('attempt-1');

      const result = prisma.result.upsert.mock.calls[0][0].create;
      expect(result.correctAnswers).toBe(1);
      expect(result.wrongAnswers).toBe(1);
      expect(result.score).toBe(5);
    });

    it('score is rounded (1/3 correct => round(3.33) = 3)', async () => {
      const prisma = buildPrismaMock({
        attempt: baseAttempt,
        questions: [
          { questionId: 'q1', type: 'SINGLE_CHOICE', correctAnswer: 'B' },
          { questionId: 'q2', type: 'SINGLE_CHOICE', correctAnswer: 'B' },
          { questionId: 'q3', type: 'SINGLE_CHOICE', correctAnswer: 'B' },
        ],
        rawAnswers: [
          { questionId: 'q1', answerValue: 'B' }, // correct
          { questionId: 'q2', answerValue: 'A' },
          { questionId: 'q3', answerValue: 'A' },
        ],
      });
      const service = await makeService(prisma);

      await service.submit('attempt-1');

      const result = prisma.result.upsert.mock.calls[0][0].create;
      // Expected business value: round((1/3)*10) = 3
      expect(Math.round(result.score)).toBe(3);
    });
  });

  // -------------------------------------------------------------------------
  // submit() — Multiple Choice PARTIAL credit (US-077).
  // credit = max(0, (correctSelected - wrongSelected) / |correctOptions|).
  // -------------------------------------------------------------------------
  describe('submit() scoring — MULTIPLE_CHOICE partial credit (US-077)', () => {
    const mcPartial = (correctAnswer: string, answerValue: string | null) =>
      buildPrismaMock({
        attempt: baseAttempt,
        questions: [
          {
            questionId: 'q1',
            type: 'MULTIPLE_CHOICE',
            correctAnswer,
            gradingMode: 'PARTIAL',
          },
        ],
        rawAnswers: [{ questionId: 'q1', answerValue }],
      });

    it('PARTIAL: chọn 1 trong 2 đáp án đúng (A của A,C) => credit 0.5 => score 5', async () => {
      const prisma = mcPartial('A,C', 'A');
      const service = await makeService(prisma);
      await service.submit('attempt-1');
      const result = prisma.result.upsert.mock.calls[0][0].create;
      expect(result.score).toBe(5);
      expect(result.correctAnswers).toBe(0); // chưa đúng hoàn toàn
    });

    it('PARTIAL: chọn đủ đúng (C,A) => credit 1 => score 10, tính là câu đúng', async () => {
      const prisma = mcPartial('A,C', 'C,A');
      const service = await makeService(prisma);
      await service.submit('attempt-1');
      const result = prisma.result.upsert.mock.calls[0][0].create;
      expect(result.score).toBe(10);
      expect(result.correctAnswers).toBe(1);
    });

    it('PARTIAL: 1 đúng + 1 sai (A,B của A,C) => (1-1)/2 = 0 => score 0', async () => {
      const prisma = mcPartial('A,C', 'A,B');
      const service = await makeService(prisma);
      await service.submit('attempt-1');
      const result = prisma.result.upsert.mock.calls[0][0].create;
      expect(result.score).toBe(0);
    });

    it('PARTIAL: 2 đúng + 1 thừa (A,B,C của A,C) => (2-1)/2 = 0.5 => score 5', async () => {
      const prisma = mcPartial('A,C', 'A,B,C');
      const service = await makeService(prisma);
      await service.submit('attempt-1');
      const result = prisma.result.upsert.mock.calls[0][0].create;
      expect(result.score).toBe(5);
    });

    it('PARTIAL: bỏ trống => credit 0 => score 0', async () => {
      const prisma = mcPartial('A,C', null);
      const service = await makeService(prisma);
      await service.submit('attempt-1');
      const result = prisma.result.upsert.mock.calls[0][0].create;
      expect(result.score).toBe(0);
    });

    it('ALL_OR_NOTHING (mặc định): chọn thiếu (A của A,C) => score 0 (khác PARTIAL)', async () => {
      const prisma = buildPrismaMock({
        attempt: baseAttempt,
        questions: [
          { questionId: 'q1', type: 'MULTIPLE_CHOICE', correctAnswer: 'A,C' },
        ],
        rawAnswers: [{ questionId: 'q1', answerValue: 'A' }],
      });
      const service = await makeService(prisma);
      await service.submit('attempt-1');
      const result = prisma.result.upsert.mock.calls[0][0].create;
      expect(result.score).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // submit() — state transition (these largely pass with current code).
  // -------------------------------------------------------------------------
  describe('submit() state transitions', () => {
    it('sets status SUBMITTED and remainingSeconds 0', async () => {
      const prisma = buildPrismaMock({
        attempt: baseAttempt,
        questions: [
          { questionId: 'q1', type: 'SINGLE_CHOICE', correctAnswer: 'B' },
        ],
        rawAnswers: [{ questionId: 'q1', answerValue: 'B' }],
      });
      const service = await makeService(prisma);

      const res: any = await service.submit('attempt-1');

      expect(res.status).toBe('SUBMITTED');
      const updateData = prisma.examAttempt.update.mock.calls[0][0].data;
      expect(updateData.status).toBe('SUBMITTED');
      expect(updateData.remainingSeconds).toBe(0);
      expect(updateData.submittedAt).toBeInstanceOf(Date);
    });

    it('creates a Result row linked to attempt/student/exam', async () => {
      const prisma = buildPrismaMock({
        attempt: baseAttempt,
        questions: [
          { questionId: 'q1', type: 'SINGLE_CHOICE', correctAnswer: 'B' },
        ],
        rawAnswers: [{ questionId: 'q1', answerValue: 'B' }],
      });
      const service = await makeService(prisma);

      await service.submit('attempt-1');

      expect(prisma.result.upsert).toHaveBeenCalledTimes(1);
      const data = prisma.result.upsert.mock.calls[0][0].create;
      expect(data.attemptId).toBe('attempt-1');
      expect(data.studentId).toBe('student-1');
      expect(data.examDefinitionId).toBe('examdef-1');
      expect(data.published).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Guard rails: cannot modify/submit a non-IN_PROGRESS attempt.
  // -------------------------------------------------------------------------
  describe('attempt state guards', () => {
    it('submit() throws BadRequest when attempt already SUBMITTED', async () => {
      const prisma = buildPrismaMock({
        attempt: { ...baseAttempt, status: 'SUBMITTED' },
        questions: [],
        rawAnswers: [],
      });
      const service = await makeService(prisma);

      await expect(service.submit('attempt-1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('submit() throws BadRequest when attempt EXPIRED', async () => {
      const prisma = buildPrismaMock({
        attempt: { ...baseAttempt, status: 'EXPIRED' },
        questions: [],
        rawAnswers: [],
      });
      const service = await makeService(prisma);

      await expect(service.submit('attempt-1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('submit() throws NotFound when attempt does not exist', async () => {
      const prisma = buildPrismaMock({
        attempt: baseAttempt,
        questions: [],
        rawAnswers: [],
      });
      prisma.examAttempt.findUnique = jest.fn(async () => null);
      const service = await makeService(prisma);

      await expect(service.submit('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('saveAnswer() throws BadRequest when attempt not IN_PROGRESS', async () => {
      const prisma = buildPrismaMock({
        attempt: { ...baseAttempt, status: 'SUBMITTED' },
        questions: [],
        rawAnswers: [],
      });
      const service = await makeService(prisma);

      await expect(
        service.saveAnswer('attempt-1', {
          questionId: '11111111-1111-4111-8111-111111111111',
          answer: 'B',
        } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
