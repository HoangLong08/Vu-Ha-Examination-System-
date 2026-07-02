'use client';

import { useEffect, useState } from 'react';
import {
  BarChart3,
  Loader2,
  AlertCircle,
  Download,
  Users,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import {
  getReportOverview,
  getExamReport,
  type ReportOverviewItem,
  type ExamReport,
} from '@/services/api';

/**
 * EPIC-20 — Báo cáo & thống kê.
 * Bảng tổng quan các đề (số bài, điểm TB, tỉ lệ đạt) + phổ điểm đề được chọn +
 * xuất CSV.
 */
export function ReportPanel() {
  const [overview, setOverview] = useState<ReportOverviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ExamReport | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const list = await getReportOverview();
        if (active) setOverview(list);
      } catch {
        if (active) setError('Không tải được báo cáo.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const openDetail = async (id: string) => {
    setLoadingDetail(true);
    setError(null);
    try {
      setSelected(await getExamReport(id));
    } catch {
      setError('Không tải được thống kê chi tiết.');
    } finally {
      setLoadingDetail(false);
    }
  };

  const exportCsv = () => {
    const header = 'Mã đề,Tên đề,Số bài,Điểm TB,Tỉ lệ đạt (%)';
    const lines = overview.map(
      (o) =>
        `${o.code ?? ''},"${(o.title ?? '').replace(/"/g, '""')}",${o.count},${o.average},${o.passRate}`,
    );
    const csv = '﻿' + [header, ...lines].join('\n'); // BOM cho Excel
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bao-cao-ket-qua.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm py-6">
        <Loader2 className="w-4 h-4 animate-spin" /> Đang tải báo cáo…
      </div>
    );
  }

  if (error && overview.length === 0) {
    return (
      <p className="flex items-center gap-1.5 text-[13px] font-medium text-rose-600 py-4">
        <AlertCircle className="w-4 h-4" /> {error}
      </p>
    );
  }

  const maxBucket = selected
    ? Math.max(1, ...selected.distribution.map((b) => b.count))
    : 1;

  return (
    <div className="flex flex-col gap-5 animate-[page-enter_0.3s_ease]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-violet-500/12 text-violet-600">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              Báo cáo kết quả thi
            </h2>
            <p className="text-[13px] text-[var(--text-secondary)]">
              Điểm trung bình, tỉ lệ đạt và phổ điểm theo từng đề.
            </p>
          </div>
        </div>
        <Button
          variant="secondary"
          onClick={exportCsv}
          disabled={overview.length === 0}
          className="px-4 py-2 gap-2 text-sm"
        >
          <Download className="w-4 h-4" /> Xuất CSV
        </Button>
      </div>

      {overview.length === 0 ? (
        <GlassCard className="p-8 flex flex-col items-center text-center">
          <BarChart3 className="w-12 h-12 text-[var(--text-muted)] mb-3" />
          <p className="text-[var(--text-secondary)]">
            Chưa có bài thi nào được nộp để thống kê.
          </p>
        </GlassCard>
      ) : (
        <GlassCard className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--bg-glass)] border-b border-[var(--border-subtle)] text-[12px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  <th className="p-4 pl-6">Mã đề</th>
                  <th className="p-4">Tên đề</th>
                  <th className="p-4 text-center">Số bài</th>
                  <th className="p-4 text-center">Điểm TB</th>
                  <th className="p-4 text-center">Tỉ lệ đạt</th>
                  <th className="p-4 pr-6 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-[13px]">
                {overview.map((o) => (
                  <tr
                    key={o.examDefinitionId}
                    className="hover:bg-[var(--bg-glass-light)] transition-colors"
                  >
                    <td className="p-4 pl-6 text-[13px] font-semibold text-brand-600 dark:text-blue-400">
                      {o.code}
                    </td>
                    <td className="p-4 text-[13px] font-medium text-[var(--text-primary)]">
                      {o.title}
                    </td>
                    <td className="p-4 text-center text-[var(--text-secondary)]">
                      {o.count}
                    </td>
                    <td className="p-4 text-center font-semibold text-[var(--text-primary)]">
                      {o.average}
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                          o.passRate >= 50
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400'
                        }`}
                      >
                        {o.passRate}%
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <button
                        onClick={() => openDetail(o.examDefinitionId)}
                        className="px-3 py-1.5 text-[13px] font-medium text-brand-600 bg-[var(--bg-glass)] hover:bg-brand-50 dark:hover:bg-brand-500/10 border border-[var(--border-subtle)] rounded-lg transition-colors"
                      >
                        Phổ điểm
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {loadingDetail && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-white text-sm bg-black/40 px-4 py-2 rounded-lg">
            <Loader2 className="w-4 h-4 animate-spin" /> Đang tải phổ điểm…
          </div>
        </div>
      )}

      <Modal
        isOpen={!!selected && !loadingDetail}
        onClose={() => setSelected(null)}
        title={selected ? `Phổ điểm — ${selected.title} (${selected.code})` : ''}
        className="max-w-2xl"
      >
        {selected && (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Stat icon={<Users className="w-4 h-4" />} label="Số bài" value={String(selected.count)} />
              <Stat icon={<TrendingUp className="w-4 h-4" />} label="Điểm TB" value={String(selected.average)} />
              <Stat icon={<BarChart3 className="w-4 h-4" />} label="Cao / Thấp" value={`${selected.max} / ${selected.min}`} />
              <Stat icon={<CheckCircle2 className="w-4 h-4" />} label="Tỉ lệ đạt" value={`${selected.passRate}%`} />
            </div>

            <div className="flex flex-col gap-2.5">
              {selected.distribution.map((b) => (
                <div key={b.label} className="flex items-center gap-3">
                  <span className="w-14 text-[13px] font-medium text-[var(--text-secondary)] shrink-0">
                    {b.label}
                  </span>
                  <div className="flex-1 h-6 rounded-md bg-[var(--bg-glass)] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-md transition-all"
                      style={{ width: `${(b.count / maxBucket) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-[13px] font-semibold text-[var(--text-primary)]">
                    {b.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="p-3 rounded-xl bg-[var(--bg-glass)] border border-[var(--border-subtle)]">
      <div className="flex items-center gap-1.5 text-[12px] text-[var(--text-secondary)] mb-1">
        {icon} {label}
      </div>
      <div className="text-[18px] font-bold text-[var(--text-primary)]">
        {value}
      </div>
    </div>
  );
}
