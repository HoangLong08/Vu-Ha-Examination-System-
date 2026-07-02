'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ClipboardList,
  Loader2,
  AlertCircle,
  Eye,
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Clock,
  Hash,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import {
  getExamDefinitions,
  getExamAttempts,
  type ExamDefinitionListItem,
  type ExamAttemptRow,
} from '@/services/api';

/** Nhãn + màu cho trạng thái lượt làm bài. */
const STATUS: Record<string, { label: string; cls: string }> = {
  IN_PROGRESS: {
    label: 'Đang làm',
    cls: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  },
  SUBMITTED: {
    label: 'Đã nộp',
    cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  },
  EXPIRED: {
    label: 'Hết giờ (tự nộp)',
    cls: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  },
  NOT_STARTED: {
    label: 'Chưa bắt đầu',
    cls: 'bg-slate-100 text-slate-600 dark:bg-slate-700/40 dark:text-slate-300',
  },
};

function fmtTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  });
}

/**
 * Khảo thí GIÁM SÁT / ĐỐI SOÁT bài làm — DRILL-IN: danh sách đề (card) → click 1
 * đề → bảng từng sinh viên (đang làm/đã nộp, số câu, điểm) + xem chi tiết.
 */
export function SubmissionsPanel() {
  const [exams, setExams] = useState<ExamDefinitionListItem[]>([]);
  const [selectedExam, setSelectedExam] = useState<ExamDefinitionListItem | null>(null);
  const [rows, setRows] = useState<ExamAttemptRow[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingRows, setLoadingRows] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getExamDefinitions()
      .then(setExams)
      .catch(() => setError('Không tải được danh sách đề.'))
      .finally(() => setLoadingList(false));
  }, []);

  const openExam = async (e: ExamDefinitionListItem) => {
    setSelectedExam(e);
    setRows([]);
    setLoadingRows(true);
    setError(null);
    try {
      setRows(await getExamAttempts(e.id));
    } catch {
      setError('Không tải được danh sách bài làm.');
    } finally {
      setLoadingRows(false);
    }
  };

  // ── DANH SÁCH ĐỀ (chưa chọn đề) ──────────────────────────────────────────
  if (!selectedExam) {
    return (
      <div className="animate-[page-enter_0.3s_ease] flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500/12 text-blue-600">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Bài làm sinh viên</h2>
            <p className="text-[13px] text-[var(--text-secondary)]">
              Chọn đề để xem ai đã/đang làm, trả lời bao nhiêu câu và được bao nhiêu điểm.
            </p>
          </div>
        </div>
        {error && (
          <p className="flex items-center gap-1.5 text-[13px] font-medium text-rose-600">
            <AlertCircle className="w-4 h-4" /> {error}
          </p>
        )}
        {loadingList ? (
          <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm py-6">
            <Loader2 className="w-4 h-4 animate-spin" /> Đang tải danh sách đề…
          </div>
        ) : exams.length === 0 ? (
          <GlassCard className="p-8 text-center text-[var(--text-secondary)]">Chưa có đề thi nào.</GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exams.map((e) => (
              <button
                key={e.id}
                onClick={() => openExam(e)}
                className="text-left"
              >
                <GlassCard className="p-5 h-full hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-brand-600 transition-colors" />
                  </div>
                  <p className="text-[13px] font-semibold text-brand-600 dark:text-blue-400 mb-0.5">{e.code}</p>
                  <h3 className="text-[15px] font-bold text-[var(--text-primary)] leading-snug mb-3 line-clamp-2">{e.title}</h3>
                  <div className="flex items-center gap-4 text-[12px] text-[var(--text-muted)] border-t border-[var(--border-subtle)] pt-3">
                    <span className="flex items-center gap-1"><Hash className="w-3.5 h-3.5" /> {e.totalQuestions} câu</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {e.durationMinutes}′</span>
                  </div>
                </GlassCard>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── CHI TIẾT BÀI LÀM CỦA 1 ĐỀ ────────────────────────────────────────────
  const submitted = rows.filter((r) => r.status === 'SUBMITTED' || r.status === 'EXPIRED');
  const avg =
    submitted.length > 0
      ? submitted.reduce((s, r) => s + (r.score ?? 0), 0) / submitted.length
      : 0;

  return (
    <div className="animate-[page-enter_0.3s_ease] flex flex-col gap-5">
      <button
        onClick={() => {
          setSelectedExam(null);
          setRows([]);
        }}
        className="inline-flex items-center gap-2 text-[14px] font-semibold text-[var(--text-secondary)] hover:text-brand-600 transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" /> Quay lại danh sách đề
      </button>

      <div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">{selectedExam.title}</h2>
        <p className="text-[14px] text-[var(--text-secondary)] mt-0.5">
          <span className="font-semibold text-brand-600 dark:text-blue-400">{selectedExam.code}</span>
          {' · '}{selectedExam.totalQuestions} câu · {selectedExam.durationMinutes} phút
        </p>
      </div>

      {error && (
        <p className="flex items-center gap-1.5 text-[13px] font-medium text-rose-600">
          <AlertCircle className="w-4 h-4" /> {error}
        </p>
      )}

      {loadingRows ? (
        <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm py-4">
          <Loader2 className="w-4 h-4 animate-spin" /> Đang tải bài làm…
        </div>
      ) : rows.length === 0 ? (
        <GlassCard className="p-8 text-center text-[var(--text-secondary)]">
          Đề này chưa có sinh viên nào vào làm.
        </GlassCard>
      ) : (
        <>
          <div className="flex flex-wrap gap-3 text-[13px] text-[var(--text-secondary)]">
            <span className="px-3 py-1.5 rounded-full bg-[var(--bg-glass)] border border-[var(--border-subtle)]">
              Tổng lượt: <b className="text-[var(--text-primary)]">{rows.length}</b>
            </span>
            <span className="px-3 py-1.5 rounded-full bg-[var(--bg-glass)] border border-[var(--border-subtle)]">
              Đã nộp: <b className="text-[var(--text-primary)]">{submitted.length}</b>
            </span>
            <span className="px-3 py-1.5 rounded-full bg-[var(--bg-glass)] border border-[var(--border-subtle)]">
              Điểm TB (đã nộp): <b className="text-[var(--text-primary)]">{avg.toFixed(2)}</b>
            </span>
          </div>

          <GlassCard className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--bg-glass)] border-b border-[var(--border-subtle)] text-[12px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    <th className="p-3 pl-5">Sinh viên</th>
                    <th className="p-3">Trạng thái</th>
                    <th className="p-3 text-center">Đã trả lời</th>
                    <th className="p-3 text-center">Điểm</th>
                    <th className="p-3">Nộp lúc</th>
                    <th className="p-3 pr-5 text-right">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)] text-[13px]">
                  {rows.map((r) => {
                    const st = STATUS[r.status] ?? STATUS.NOT_STARTED;
                    const graded = r.score != null;
                    return (
                      <tr
                        key={r.attemptId}
                        className="hover:bg-[var(--bg-glass-light)] transition-colors"
                      >
                        <td className="p-3 pl-5">
                          <p className="font-semibold text-[var(--text-primary)]">{r.studentName}</p>
                          <p className="text-[12px] text-[var(--text-muted)]">{r.studentCode}</p>
                        </td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${st.cls}`}>
                            {st.label}
                          </span>
                        </td>
                        <td className="p-3 text-center text-[var(--text-secondary)]">
                          {r.answeredCount}/{r.totalQuestions}
                        </td>
                        <td className="p-3 text-center">
                          {graded ? (
                            <span className="font-bold text-[var(--text-primary)]">{r.score!.toFixed(2)}</span>
                          ) : (
                            <span className="text-[var(--text-muted)]">—</span>
                          )}
                          {r.correctAnswers != null && (
                            <span className="block text-[11px] text-[var(--text-muted)]">
                              đúng {r.correctAnswers}/{r.totalQuestions}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-[var(--text-secondary)]">{fmtTime(r.submittedAt)}</td>
                        <td className="p-3 pr-5 text-right">
                          {graded ? (
                            <Link
                              href={`/exam/${selectedExam.id}/result?attempt=${r.attemptId}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold bg-[var(--bg-glass)] hover:bg-brand-50 dark:hover:bg-brand-500/10 border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-brand-600 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" /> Xem bài
                            </Link>
                          ) : (
                            <span className="text-[12px] text-[var(--text-muted)]">chưa nộp</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </>
      )}
    </div>
  );
}
