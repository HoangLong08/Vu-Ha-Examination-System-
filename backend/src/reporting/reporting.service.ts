import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** Ngưỡng đạt (thang điểm 10). */
export const PASS_THRESHOLD = 5.0;

export interface ScoreBucket {
  label: string;
  count: number;
}

export interface ExamStats {
  count: number;
  average: number;
  max: number;
  min: number;
  passCount: number;
  passRate: number; // %
  distribution: ScoreBucket[];
}

export interface ExamReport extends ExamStats {
  examDefinitionId: string;
  code: string | null;
  title: string | null;
}

export interface OverviewItem {
  examDefinitionId: string;
  code: string | null;
  title: string | null;
  count: number;
  average: number;
  passRate: number;
}

interface ResultRow {
  examDefinitionId: string;
  score: number;
}

const BUCKETS = ['0–2', '2–4', '4–6', '6–8', '8–10'];

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Tổng hợp thống kê từ danh sách điểm (thang 10). */
export function summarize(rows: { score: number }[]): ExamStats {
  const distribution: ScoreBucket[] = BUCKETS.map((label) => ({
    label,
    count: 0,
  }));
  if (rows.length === 0) {
    return {
      count: 0,
      average: 0,
      max: 0,
      min: 0,
      passCount: 0,
      passRate: 0,
      distribution,
    };
  }

  let sum = 0;
  let max = -Infinity;
  let min = Infinity;
  let passCount = 0;
  for (const { score } of rows) {
    sum += score;
    if (score > max) max = score;
    if (score < min) min = score;
    if (score >= PASS_THRESHOLD) passCount += 1;
    // bin: [0-2)…[8-10]; điểm 10 rơi vào bucket cuối.
    const idx = Math.min(BUCKETS.length - 1, Math.floor(score / 2));
    distribution[idx].count += 1;
  }

  return {
    count: rows.length,
    average: round(sum / rows.length),
    max: round(max),
    min: round(min),
    passCount,
    passRate: round((passCount / rows.length) * 100),
    distribution,
  };
}

/**
 * EPIC-20 — Báo cáo & thống kê kết quả thi cho khảo thí/admin.
 */
@Injectable()
export class ReportingService {
  constructor(private prisma: PrismaService) {}

  /** Thống kê chi tiết một đề (gồm phổ điểm). */
  async getExamReport(examDefinitionId: string): Promise<ExamReport> {
    const [rows, def] = await Promise.all([
      this.prisma.result.findMany({
        where: { examDefinitionId },
        select: { score: true },
      }),
      this.prisma.examDefinition.findUnique({
        where: { id: examDefinitionId },
        select: { code: true, title: true },
      }),
    ]);
    return {
      examDefinitionId,
      code: def?.code ?? null,
      title: def?.title ?? null,
      ...summarize(rows),
    };
  }

  /** Tổng quan tất cả đề có kết quả (điểm TB + tỉ lệ đạt). */
  async getOverview(): Promise<OverviewItem[]> {
    const [rows, defs] = await Promise.all([
      this.prisma.result.findMany({
        select: { examDefinitionId: true, score: true },
      }),
      this.prisma.examDefinition.findMany({
        select: { id: true, code: true, title: true },
      }),
    ]);

    const byExam = new Map<string, ResultRow[]>();
    for (const r of rows as ResultRow[]) {
      const list = byExam.get(r.examDefinitionId) ?? [];
      list.push(r);
      byExam.set(r.examDefinitionId, list);
    }

    const items: OverviewItem[] = [];
    for (const def of defs) {
      const list = byExam.get(def.id);
      if (!list || list.length === 0) continue; // chỉ đề đã có bài nộp
      const s = summarize(list);
      items.push({
        examDefinitionId: def.id,
        code: def.code,
        title: def.title,
        count: s.count,
        average: s.average,
        passRate: s.passRate,
      });
    }
    // nhiều bài nộp nhất lên trước
    return items.sort((a, b) => b.count - a.count);
  }
}
