import { Test, TestingModule } from '@nestjs/testing';
import { ReportingService, summarize } from './reporting.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * EPIC-20 — Báo cáo & thống kê. Kiểm tra tổng hợp điểm + phổ điểm + tỉ lệ đạt.
 */
describe('summarize (thống kê điểm thang 10)', () => {
  it('rỗng => count 0, mọi giá trị 0, phổ điểm 5 bucket = 0', () => {
    const s = summarize([]);
    expect(s.count).toBe(0);
    expect(s.average).toBe(0);
    expect(s.passRate).toBe(0);
    expect(s.distribution).toHaveLength(5);
    expect(s.distribution.every((b) => b.count === 0)).toBe(true);
  });

  it('tính đúng average/max/min/passRate + phổ điểm', () => {
    const s = summarize([
      { score: 10 },
      { score: 8 },
      { score: 5 },
      { score: 4 },
      { score: 2 },
    ]);
    expect(s.count).toBe(5);
    expect(s.average).toBe(5.8); // (10+8+5+4+2)/5
    expect(s.max).toBe(10);
    expect(s.min).toBe(2);
    // đạt = score>=5 -> 10,8,5 => 3/5 = 60%
    expect(s.passCount).toBe(3);
    expect(s.passRate).toBe(60);
    // bucket: 2->[2-4], 4->[4-6], 5->[4-6], 8->[8-10], 10->[8-10]
    const byLabel = Object.fromEntries(
      s.distribution.map((b) => [b.label, b.count]),
    );
    expect(byLabel['8–10']).toBe(2); // 8 và 10
    expect(byLabel['4–6']).toBe(2); // 4 và 5
    expect(byLabel['2–4']).toBe(1); // 2
    expect(byLabel['0–2']).toBe(0);
  });
});

function makePrisma(resultRows: any[], defs: any[]) {
  return {
    result: { findMany: jest.fn(async () => resultRows) },
    examDefinition: {
      findMany: jest.fn(async () => defs),
      findUnique: jest.fn(async () => defs[0] ?? null),
    },
  } as any;
}

async function makeService(prisma: any): Promise<ReportingService> {
  const mod: TestingModule = await Test.createTestingModule({
    providers: [ReportingService, { provide: PrismaService, useValue: prisma }],
  }).compile();
  return mod.get(ReportingService);
}

describe('ReportingService', () => {
  it('getExamReport gắn code/title + thống kê', async () => {
    const prisma = makePrisma(
      [{ score: 6 }, { score: 4 }],
      [{ code: 'PH1020', title: 'Lịch sử Đảng' }],
    );
    const svc = await makeService(prisma);
    const r = await svc.getExamReport('def-1');
    expect(r.code).toBe('PH1020');
    expect(r.count).toBe(2);
    expect(r.average).toBe(5);
    expect(r.passRate).toBe(50);
  });

  it('getOverview gộp theo đề, bỏ đề chưa có bài, sắp theo số bài', async () => {
    const prisma = makePrisma(
      [
        { examDefinitionId: 'a', score: 8 },
        { examDefinitionId: 'a', score: 6 },
        { examDefinitionId: 'b', score: 3 },
      ],
      [
        { id: 'a', code: 'A', title: 'Đề A' },
        { id: 'b', code: 'B', title: 'Đề B' },
        { id: 'c', code: 'C', title: 'Đề C (chưa thi)' },
      ],
    );
    const svc = await makeService(prisma);
    const list = await svc.getOverview();
    expect(list.map((i) => i.examDefinitionId)).toEqual(['a', 'b']); // c bị loại, a trước b
    expect(list[0].count).toBe(2);
    expect(list[0].average).toBe(7);
  });
});
