import { Test, TestingModule } from '@nestjs/testing';
import { InvigilatorService } from './invigilator.service';
import { PrismaService } from '../prisma/prisma.service';

function makeService(attempts: any[]): Promise<InvigilatorService> {
  const prisma = {
    examAttempt: { findMany: jest.fn(async () => attempts) },
    examDefinition: {
      findUnique: jest.fn(async () => ({
        totalQuestions: 10,
        durationMinutes: 30,
      })),
    },
  } as any;
  return Test.createTestingModule({
    providers: [
      InvigilatorService,
      { provide: PrismaService, useValue: prisma },
    ],
  })
    .compile()
    .then((m) => m.get(InvigilatorService));
}

describe('InvigilatorService (dữ liệu thật)', () => {
  it('getSessions gộp lượt thi theo đề + đếm trạng thái', async () => {
    const svc = await makeService([
      {
        examDefinitionId: 'e1',
        status: 'IN_PROGRESS',
        examDefinition: { code: 'CS101', title: 'Lập trình' },
        createdAt: new Date(),
      },
      {
        examDefinitionId: 'e1',
        status: 'SUBMITTED',
        examDefinition: { code: 'CS101', title: 'Lập trình' },
        createdAt: new Date(),
      },
    ]);
    const list = await svc.getSessions();
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({
      id: 'e1',
      inProgress: 1,
      submitted: 1,
      status: 'ONGOING',
    });
    // sĩ số phòng = danh sách lớp giả lập (>= số thật)
    expect(list[0].totalStudents).toBeGreaterThanOrEqual(2);
  });

  it('getSessionStudents map tên/mã + tiến độ + còn giờ', async () => {
    const startedAt = new Date(Date.now() - 60_000); // 1 phút trước
    const svc = await makeService([
      {
        id: 'a1',
        status: 'IN_PROGRESS',
        startedAt,
        clientIp: '10.0.0.5',
        student: { fullName: 'Lý Ngọc Vy', studentCode: 'SV2110' },
        examDefinition: { totalQuestions: 10, durationMinutes: 30 },
        _count: { answers: 3 },
      },
    ]);
    const rows = await svc.getSessionStudents('e1');
    // SV thật có trong danh sách + đúng trạng thái/tiến độ
    const real = rows.find((r) => r.studentCode === 'SV2110');
    expect(real).toMatchObject({
      fullName: 'Lý Ngọc Vy',
      status: 'IN_PROGRESS',
      answered: 3,
      total: 10,
      ipAddress: '10.0.0.5',
    });
    expect(real!.remainingSeconds).toBeGreaterThan(1700);
    expect(real!.remainingSeconds).toBeLessThanOrEqual(1800);
    // sĩ số phòng = 20 tài khoản SV + lượt thật -> có người "chưa đăng nhập"
    expect(rows.length).toBeGreaterThanOrEqual(20);
    expect(rows.some((r) => r.status === 'NOT_STARTED')).toBe(true);
    // máy được đánh số liên tục
    expect(rows[0].machineId).toBe('PC-01');
  });
});
