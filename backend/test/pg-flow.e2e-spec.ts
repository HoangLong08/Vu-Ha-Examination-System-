import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { IpRangeGuard } from './../src/common/guards/ip-range.guard';
import { AllExceptionsFilter } from './../src/common/filters/all-exceptions.filter';
import { TransformInterceptor } from './../src/common/interceptors/transform.interceptor';

/**
 * UAT e2e với POSTGRES THẬT (không mock Prisma). Chạy toàn bộ vòng đời thi qua
 * HTTP trên DB thật: dev-login -> start (snapshot) -> lưu đáp án -> nộp -> chấm
 * -> xem kết quả. Bắt các lỗi mà e2e mock không thấy (upsert, snapshot, transaction…).
 *
 * CHỈ chạy khi PG_E2E=1 (CI có Postgres service + prisma db push). Bỏ qua ở local
 * thường để không cần DB. Câu hỏi lấy từ mock-api (EXAM_SOURCE=mock mặc định).
 */
const itPg = process.env.PG_E2E === '1' ? describe : describe.skip;

itPg('UAT — exam flow trên Postgres thật (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const EXAM_DEF_ID = 'e2e00000-0000-4000-8000-000000000001';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      // Bỏ chặn dải IP phòng lab (không liên quan UAT chấm điểm).
      .overrideGuard(IpRangeGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalInterceptors(new TransformInterceptor());
    await app.init();

    prisma = app.get(PrismaService);
    // Đề thi tối thiểu cho luồng (nguồn câu hỏi = mock-api questions.json).
    await prisma.examDefinition.upsert({
      where: { id: EXAM_DEF_ID },
      update: { showResult: true, maxAttempt: 5 },
      create: {
        id: EXAM_DEF_ID,
        code: 'E2E-PG-001',
        title: 'UAT Postgres — luồng thi',
        durationMinutes: 60,
        totalQuestions: 4,
        showResult: true,
        maxAttempt: 5,
        sourceSystem: 'E2E',
      },
    });
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('dev-login -> start -> answer -> submit -> review (chấm trên DB thật)', async () => {
    const server = app.getHttpServer();

    // 1) Đăng nhập dev (tạo User + token thật).
    const login = await request(server)
      .post('/api/auth/login')
      .send({ email: 'uat-pg-student@dau.edu.vn', password: 'x' })
      .expect(200);
    const token = login.body?.data?.token?.accessToken;
    expect(typeof token).toBe('string');

    const auth = (r: request.Test) => r.set('Authorization', `Bearer ${token}`);

    // 2) Bắt đầu thi (tạo attempt + snapshot câu hỏi).
    const start = await auth(
      request(server).post(`/api/v1/exams/${EXAM_DEF_ID}/start`).send({}),
    ).expect(201);
    const attemptId = start.body?.data?.attemptId;
    expect(typeof attemptId).toBe('string');

    // 3) Lấy câu hỏi (đã strip đáp án) + trả lời câu đầu.
    const qres = await auth(
      request(server).get(`/api/v1/exams/${EXAM_DEF_ID}/questions`),
    ).expect(200);
    const questions = qres.body?.data?.data ?? qres.body?.data ?? [];
    expect(Array.isArray(questions)).toBe(true);
    expect(questions.length).toBeGreaterThan(0);
    const q0 = questions[0];
    await auth(
      request(server)
        .post(`/api/v1/attempts/${attemptId}/answers`)
        .send({ questionId: q0.id, answer: q0.options?.[0]?.key ?? 'A' }),
    ).expect(201);

    // 4) Nộp bài (chấm + ghi Result trên DB thật).
    await auth(
      request(server).post(`/api/v1/attempts/${attemptId}/submit`).send({}),
    ).expect(201);

    // 5) Xem kết quả chi tiết.
    const review = await auth(
      request(server).get(`/api/v1/attempts/${attemptId}/review`),
    ).expect(200);
    const data = review.body?.data;
    expect(typeof data.result.score).toBe('number');
    expect(data.summary.total).toBe(4);

    // 6) Đối soát trực tiếp DB: Result tồn tại + attempt SUBMITTED.
    const result = await prisma.result.findUnique({ where: { attemptId } });
    expect(result).not.toBeNull();
    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
    });
    expect(attempt?.status).toBe('SUBMITTED');
  });
});
