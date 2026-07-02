import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { randomUUID } from 'crypto';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { JwtAuthGuard } from './../src/auth/guards/jwt-auth.guard';
import { IpRangeGuard } from './../src/common/guards/ip-range.guard';
import { RolesGuard } from './../src/common/guards/roles.guard';
import { AllExceptionsFilter } from './../src/common/filters/all-exceptions.filter';
import { TransformInterceptor } from './../src/common/interceptors/transform.interceptor';

/**
 * Integration test (Supertest) — luồng làm bài đầu→cuối qua HTTP.
 * Quy trình CAIRA-DAU v1.0 — Bảng 5.1 (Integration ≥1/User Story).
 *
 * US phủ:
 *  - US-047/048/049/050: check-device + start attempt (pre-check, khởi tạo lượt thi)
 *  - US-054: lưu/auto-save đáp án (answers + autosave)
 *  - US-076/077/078/079: chấm điểm khi submit (single + multiple, partial/all-or-nothing)
 *
 * Mock Prisma in-memory: state nhất quán giữa các bước (examAttempt, attemptAnswer,
 * attemptQuestion, examDefinition, result). app.init() KHÔNG kết nối Postgres thật.
 */

// ---- In-memory store ----
interface AttemptRow {
  id: string;
  studentId: string;
  sessionId: string;
  examDefinitionId: string;
  status: string;
  startedAt: Date | null;
  submittedAt: Date | null;
  remainingSeconds: number;
  clientIp?: string;
  userAgent?: string;
  createdAt: Date;
}
interface AnswerRow {
  attemptId: string;
  questionId: string;
  answerValue: string;
  answeredAt: Date;
}
interface QuestionRow {
  attemptId: string;
  questionId: string;
  questionType: string;
  questionSnapshot: any;
}
interface ResultRow {
  attemptId: string;
  studentId: string;
  examDefinitionId: string;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  score: number;
  published: boolean;
  createdAt: Date;
}

describe('Exam flow (e2e integration)', () => {
  let app: INestApplication<App>;

  // UUID v4 hợp lệ (variant nibble 8/9/a/b) để qua @IsUUID()/ParseUUIDPipe.
  const STUDENT_ID = 'a5d3045e-bc05-4eec-8cf7-01f4dfec7b4f';
  const EXAM_DEF_ID = '5e52d631-7ea5-4f8e-93ba-e7eae92510f4';
  // 3 câu hỏi snapshot kèm correctAnswer (mô phỏng snapshot lúc start).
  const Q_SINGLE = '09d89123-fa2e-48d2-a221-8b109cbabcb0'; // SINGLE_CHOICE, đúng = "B"
  const Q_MULTI = '3febdda9-0aa5-4f5d-923b-477a3c20f1b2'; // MULTIPLE_CHOICE all-or-nothing, đúng = "A,C"
  const Q_TF = '5063b070-b35c-4079-8e12-82737408a10b'; // TRUE_FALSE, đúng = "TRUE"

  // store
  const attempts = new Map<string, AttemptRow>();
  const answers: AnswerRow[] = [];
  const questions: QuestionRow[] = [];
  const examDefs = new Map<string, any>();
  const results = new Map<string, ResultRow>();

  function seedQuestions(attemptId: string) {
    questions.push(
      {
        attemptId,
        questionId: Q_SINGLE,
        questionType: 'SINGLE_CHOICE',
        questionSnapshot: { type: 'SINGLE_CHOICE', correctAnswer: 'B' },
      },
      {
        attemptId,
        questionId: Q_MULTI,
        questionType: 'MULTIPLE_CHOICE',
        questionSnapshot: {
          type: 'MULTIPLE_CHOICE',
          correctAnswer: 'A,C',
          gradingMode: 'ALL_OR_NOTHING',
        },
      },
      {
        attemptId,
        questionId: Q_TF,
        questionType: 'TRUE_FALSE',
        questionSnapshot: { type: 'TRUE_FALSE', correctAnswer: 'TRUE' },
      },
    );
  }

  const mockPrisma = {
    student: {
      upsert: jest.fn(({ create }: any) => Promise.resolve({ id: create.id })),
    },
    examAttempt: {
      findFirst: jest.fn(({ where }: any) => {
        const list = [...attempts.values()].filter((a) => {
          if (where.studentId && a.studentId !== where.studentId) return false;
          if (
            where.examDefinitionId &&
            a.examDefinitionId !== where.examDefinitionId
          )
            return false;
          if (where.status?.in && !where.status.in.includes(a.status))
            return false;
          if (typeof where.status === 'string' && a.status !== where.status)
            return false;
          return true;
        });
        return Promise.resolve(list[0] ?? null);
      }),
      findUnique: jest.fn(({ where }: any) =>
        Promise.resolve(attempts.get(where.id) ?? null),
      ),
      findMany: jest.fn(({ where }: any = {}) => {
        let list = [...attempts.values()];
        if (where?.status) list = list.filter((a) => a.status === where.status);
        return Promise.resolve(list);
      }),
      create: jest.fn(({ data }: any) => {
        const row: AttemptRow = {
          id: randomUUID(),
          studentId: data.studentId,
          sessionId: data.sessionId,
          examDefinitionId: data.examDefinitionId,
          status: data.status,
          startedAt: data.startedAt ?? null,
          submittedAt: null,
          remainingSeconds: data.remainingSeconds,
          clientIp: data.clientIp,
          userAgent: data.userAgent,
          createdAt: new Date(),
        };
        attempts.set(row.id, row);
        seedQuestions(row.id);
        return Promise.resolve(row);
      }),
      update: jest.fn(({ where, data }: any) => {
        const row = attempts.get(where.id);
        if (!row) throw new Error('attempt not found');
        Object.assign(row, data);
        return Promise.resolve(row);
      }),
      count: jest.fn(({ where }: any = {}) => {
        const list = [...attempts.values()].filter((a) => {
          if (where?.studentId && a.studentId !== where.studentId) return false;
          if (
            where?.examDefinitionId &&
            a.examDefinitionId !== where.examDefinitionId
          )
            return false;
          if (where?.status?.in && !where.status.in.includes(a.status))
            return false;
          return true;
        });
        return Promise.resolve(list.length);
      }),
    },
    examDefinition: {
      findUnique: jest.fn(({ where }: any) =>
        Promise.resolve(examDefs.get(where.id) ?? null),
      ),
    },
    sessionExam: {
      findFirst: jest.fn(() => Promise.resolve(null)),
    },
    attemptAnswer: {
      upsert: jest.fn(({ where, update, create }: any) => {
        const key = where.attemptId_questionId;
        const existing = answers.find(
          (a) =>
            a.attemptId === key.attemptId && a.questionId === key.questionId,
        );
        if (existing) {
          existing.answerValue = update.answerValue;
          existing.answeredAt = update.answeredAt;
          return Promise.resolve(existing);
        }
        const row: AnswerRow = {
          attemptId: create.attemptId,
          questionId: create.questionId,
          answerValue: create.answerValue,
          answeredAt: create.answeredAt,
        };
        answers.push(row);
        return Promise.resolve(row);
      }),
      findMany: jest.fn(({ where }: any) =>
        Promise.resolve(answers.filter((a) => a.attemptId === where.attemptId)),
      ),
    },
    attemptQuestion: {
      findMany: jest.fn(({ where }: any) =>
        Promise.resolve(
          questions.filter((q) => q.attemptId === where.attemptId),
        ),
      ),
      // startExam snapshot — no-op ở e2e: câu hỏi đã được seedQuestions() gắn khi
      // examAttempt.create (giữ kịch bản 3 câu xác định để chấm 2/3).
      createMany: jest.fn(() => Promise.resolve({ count: 0 })),
    },
    result: {
      create: jest.fn(({ data }: any) => {
        const row: ResultRow = { ...data, createdAt: new Date() };
        results.set(data.attemptId, row);
        return Promise.resolve(row);
      }),
      upsert: jest.fn(({ where, update, create }: any) => {
        const existing = results.get(where.attemptId);
        const row: ResultRow = existing
          ? { ...existing, ...update }
          : { ...create, createdAt: new Date() };
        results.set(where.attemptId, row);
        return Promise.resolve(row);
      }),
      findUnique: jest.fn(({ where }: any) =>
        Promise.resolve(results.get(where.attemptId) ?? null),
      ),
      findMany: jest.fn(({ where }: any = {}) => {
        let list = [...results.values()];
        if (where?.studentId)
          list = list.filter((r) => r.studentId === where.studentId);
        if (where?.published !== undefined)
          list = list.filter((r) => r.published === where.published);
        return Promise.resolve(list);
      }),
      updateMany: jest.fn(({ where, data }: any) => {
        let count = 0;
        for (const r of results.values()) {
          if (
            !where?.examDefinitionId ||
            r.examDefinitionId === where.examDefinitionId
          ) {
            Object.assign(r, data);
            count += 1;
          }
        }
        return Promise.resolve({ count });
      }),
    },
  };

  // attemptId được tạo ở bước /start, dùng lại cho các bước sau.
  let attemptId: string;

  beforeAll(async () => {
    // maxAttempt cao: e2e dùng chung student, nhiều lần start — không test giới hạn ở đây.
    examDefs.set(EXAM_DEF_ID, {
      id: EXAM_DEF_ID,
      durationMinutes: 60,
      maxAttempt: 99,
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (ctx: any) => {
          ctx.switchToHttp().getRequest().user = {
            id: STUDENT_ID,
            roles: ['STUDENT'],
          };
          return true;
        },
      })
      .overrideGuard(IpRangeGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    // Áp đúng pipeline production (src/main.ts)
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalInterceptors(new TransformInterceptor());
    await app.init();
  });

  afterAll(async () => {
    // Đóng app => dừng cron ScheduleModule, tránh treo Jest open handles.
    await app.close();
  });

  // ---- US-047/048: Device pre-check ----
  it('POST /exams/:examId/check-device — passed=true khi mọi cờ true (US-047)', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/exams/${EXAM_DEF_ID}/check-device`)
      .send({
        browserCompatible: true,
        audioFunctional: true,
        pingStable: true,
      })
      .expect(201);
    expect(res.body.data.passed).toBe(true);
  });

  it('POST /exams/:examId/check-device — passed=false khi một cờ false (US-048)', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/exams/${EXAM_DEF_ID}/check-device`)
      .send({
        browserCompatible: true,
        audioFunctional: false,
        pingStable: true,
      })
      .expect(201);
    expect(res.body.data.passed).toBe(false);
  });

  // ---- US-049/050: Start attempt ----
  it('POST /exams/:examId/start — tạo attempt, trả attemptId + remainingSeconds (US-049/050)', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/exams/${EXAM_DEF_ID}/start`)
      .send({})
      .expect(201);
    expect(res.body.data.attemptId).toBeDefined();
    expect(res.body.data.remainingSeconds).toBe(60 * 60);
    expect(res.body.data.status).toBe('IN_PROGRESS');
    attemptId = res.body.data.attemptId;
  });

  // ---- US-054: Save single answer ----
  it('POST /attempts/:attemptId/answers — lưu 1 đáp án single đúng (US-054)', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/attempts/${attemptId}/answers`)
      .send({ questionId: Q_SINGLE, answer: 'B' })
      .expect(201);
    expect(res.body.data.questionId).toBe(Q_SINGLE);
    expect(res.body.data.answerValue).toBe('B');
  });

  // ---- US-054: Autosave (bulk) ----
  it('POST /attempts/:attemptId/autosave — lưu nhiều đáp án (US-054)', async () => {
    const ts = new Date().toISOString();
    const res = await request(app.getHttpServer())
      .post(`/api/v1/attempts/${attemptId}/autosave`)
      .send({
        answers: [
          { questionId: Q_MULTI, answer: 'A,C', timestamp: ts }, // đúng hoàn toàn
          { questionId: Q_TF, answer: 'FALSE', timestamp: ts }, // sai
        ],
      })
      .expect(201);
    expect(res.body.data.savedCount).toBe(2);
  });

  // ---- US-076..079: Submit + chấm điểm ----
  it('POST /attempts/:attemptId/submit — chấm điểm: 2/3 đúng => score=6.67 (US-076..079)', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/attempts/${attemptId}/submit`)
      .expect(201);
    expect(res.body.data.status).toBe('SUBMITTED');

    // Kết quả đã lưu: single đúng (B) + multiple đúng (A,C) = 2/3; TF sai.
    // score = round(2/3 * 10, 2) = 6.67
    const result = results.get(attemptId)!;
    expect(result.totalQuestions).toBe(3);
    expect(result.correctAnswers).toBe(2);
    expect(result.wrongAnswers).toBe(1);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeCloseTo(6.67, 2);
  });

  it('GET /results/:attemptId — SV KHÔNG xem được khi kết quả chưa công bố (FR-L-001) => 403', async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/results/${attemptId}`)
      .expect(403);
  });

  it('POST publish rồi SV đọc được kết quả đã chấm (EPIC-18, UC-046, US-079)', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/exams/${EXAM_DEF_ID}/results/publish`)
      .expect(201);
    const res = await request(app.getHttpServer())
      .get(`/api/v1/results/${attemptId}`)
      .expect(200);
    expect(res.body.data.correctAnswers).toBe(2);
    expect(res.body.data.score).toBeCloseTo(6.67, 2);
  });

  // ---- Error cases ----
  it('POST submit lại attempt đã SUBMITTED => 400 (không IN_PROGRESS)', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/attempts/${attemptId}/submit`)
      .expect(400);
  });

  it('POST submit attemptId không tồn tại => 404', async () => {
    const ghost = randomUUID();
    await request(app.getHttpServer())
      .post(`/api/v1/attempts/${ghost}/submit`)
      .expect(404);
  });

  it('ParseUUIDPipe: attemptId không phải UUID => 400', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/attempts/not-a-uuid/submit`)
      .expect(400);
  });

  it('ValidationPipe: body sai kiểu (questionId là số, không phải string) => 400', async () => {
    // Cần một attempt IN_PROGRESS để đi tới ValidationPipe trên body.
    const startRes = await request(app.getHttpServer())
      .post(`/api/v1/exams/${EXAM_DEF_ID}/start`)
      .send({})
      .expect(201);
    const aId = startRes.body.data.attemptId;
    // questionId giờ là @IsString (ID đề ngoài, không bắt UUID) — gửi số -> 400.
    await request(app.getHttpServer())
      .post(`/api/v1/attempts/${aId}/answers`)
      .send({ questionId: 12345, answer: 'B' })
      .expect(400);
  });
});
