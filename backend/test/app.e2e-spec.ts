import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { JwtAuthGuard } from './../src/auth/guards/jwt-auth.guard';
import { IpRangeGuard } from './../src/common/guards/ip-range.guard';
import { RolesGuard } from './../src/common/guards/roles.guard';
import { AllExceptionsFilter } from './../src/common/filters/all-exceptions.filter';
import { TransformInterceptor } from './../src/common/interceptors/transform.interceptor';

/**
 * Smoke test (e2e) — Quy trình CAIRA-DAU v1.0.
 *
 * Boot toàn bộ AppModule QUA HTTP nhưng KHÔNG cần Postgres thật:
 *  - override PrismaService bằng mock in-memory (app.init() không $connect)
 *  - override toàn bộ guard cho qua + gắn user giả
 *  - áp đúng pipeline production (global prefix /api, ValidationPipe,
 *    AllExceptionsFilter, TransformInterceptor) giống src/main.ts
 *
 * Route gốc `GET /` đã bị bỏ (app có global prefix /api, không có handler gốc) —
 * smoke test thật gọi một endpoint tồn tại và assert response shape chuẩn.
 */
describe('App smoke (e2e)', () => {
  let app: INestApplication<App>;

  const STUDENT_ID = '11111111-1111-1111-1111-111111111111';

  const mockPrisma = {
    // In-memory: không có exam => check-device không đụng DB; trả về 200.
    examAttempt: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    examDefinition: { findUnique: jest.fn() },
    attemptAnswer: { findMany: jest.fn() },
    attemptQuestion: { findMany: jest.fn() },
    result: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn() },
  };

  beforeAll(async () => {
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
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalInterceptors(new TransformInterceptor());
    await app.init();
  });

  afterAll(async () => {
    // Đóng app để dừng ScheduleModule cron, tránh treo Jest.
    await app.close();
  });

  it('POST /api/v1/exams/:examId/check-device trả 201 + response shape chuẩn', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/exams/22222222-2222-2222-2222-222222222222/check-device')
      .send({
        browserCompatible: true,
        audioFunctional: true,
        pingStable: true,
      })
      .expect(201);

    expect(res.body).toMatchObject({ code: 'SUCCESS' });
    expect(res.body.data.passed).toBe(true);
  });
});
