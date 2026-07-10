'use client';

import { useEffect, useState } from 'react';
import {
  Database,
  ClipboardList,
  TrendingUp,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { getExamDefinitions, getReportOverview } from '@/services/api';

/**
 * Thẻ tổng quan khảo thí — SỐ THẬT (thay 4 thẻ hardcode):
 *  - Tổng số đề thi (getExamDefinitions)
 *  - Tổng lượt đã nộp + Điểm TB + Tỉ lệ đạt toàn hệ (getReportOverview, weighted theo số bài).
 */
export function OverviewStats() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    exams: 0,
    submissions: 0,
    avg: 0,
    passRate: 0,
  });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [defs, report] = await Promise.all([
          getExamDefinitions(),
          getReportOverview().catch(() => []),
        ]);
        if (!active) return;
        const submissions = report.reduce((s, r) => s + r.count, 0);
        const avg =
          submissions > 0
            ? report.reduce((s, r) => s + r.average * r.count, 0) / submissions
            : 0;
        const passRate =
          submissions > 0
            ? report.reduce((s, r) => s + r.passRate * r.count, 0) / submissions
            : 0;
        setStats({
          exams: defs.length,
          submissions,
          avg: Math.round(avg * 100) / 100,
          passRate: Math.round(passRate * 10) / 10,
        });
      } catch {
        /* giữ 0 nếu lỗi */
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const cards = [
    {
      icon: Database,
      color: 'blue',
      value: String(stats.exams),
      label: 'Tổng số đề thi',
    },
    {
      icon: ClipboardList,
      color: 'emerald',
      value: String(stats.submissions),
      label: 'Lượt đã nộp bài',
    },
    {
      icon: TrendingUp,
      color: 'amber',
      value: stats.avg.toFixed(2),
      label: 'Điểm trung bình',
    },
    {
      icon: CheckCircle2,
      color: 'rose',
      value: `${stats.passRate}%`,
      label: 'Tỉ lệ đạt (≥5)',
    },
  ];
  const tint: Record<string, string> = {
    blue: 'bg-blue-500/12 text-blue-500',
    emerald: 'bg-emerald-500/12 text-emerald-600',
    amber: 'bg-amber-500/12 text-amber-600',
    rose: 'bg-rose-500/12 text-rose-600',
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <GlassCard key={c.label} className="relative overflow-hidden">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3.5 ${tint[c.color]}`}
            >
              <Icon className="w-[22px] h-[22px]" />
            </div>
            <div className="text-[28px] font-bold text-[var(--text-primary)] leading-none mb-1 min-h-[28px]">
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin text-[var(--text-muted)]" />
              ) : (
                c.value
              )}
            </div>
            <div className="text-[13px] font-medium text-[var(--text-secondary)]">
              {c.label}
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}
