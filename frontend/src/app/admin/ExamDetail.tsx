'use client';

import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Database,
  Send,
  BookOpen,
  Clock,
  Hash,
  Shuffle,
  RefreshCw,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import {
  getExamDefinition,
  setExamConfig,
  publishResults,
  unpublishResults,
  getExamCoreMatrices,
  type ExamDefinitionListItem,
  type ExamCoreMatrix,
} from '@/services/api';

/**
 * Chi tiết MỘT đề thi (khảo thí): thông tin + cấu hình hiện/ẩn điểm + nguồn câu
 * hỏi (ma trận) + công bố/gỡ công bố kết quả — TẤT CẢ theo đúng đề này (thay cho
 * card cấu hình gắn cứng 1 đề demo trước đây).
 */
export function ExamDetail({
  exam,
  onBack,
}: {
  exam: ExamDefinitionListItem;
  onBack: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [showResult, setShowResult] = useState(exam.showResult);
  const [matrices, setMatrices] = useState<ExamCoreMatrix[]>([]);
  const [matrixId, setMatrixId] = useState(exam.examCoreMatrixId ?? '');
  // Cấu hình làm bài.
  const [maxAttempt, setMaxAttempt] = useState<number>(1);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleAnswers, setShuffleAnswers] = useState(false);
  const [savingPlay, setSavingPlay] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingSource, setSavingSource] = useState(false);
  const [publishing, setPublishing] = useState<'pub' | 'unpub' | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [def, mtx] = await Promise.all([
          getExamDefinition(exam.id),
          getExamCoreMatrices().catch(() => ({ source: 'mock', items: [] })),
        ]);
        if (active) {
          setShowResult(def.showResult);
          setMatrixId(def.examCoreMatrixId ?? '');
          setMaxAttempt(def.maxAttempt ?? 1);
          setShuffleQuestions(def.shuffleQuestions ?? false);
          setShuffleAnswers(def.shuffleAnswers ?? false);
          setMatrices(mtx.items);
        }
      } catch {
        if (active) setError('Không tải được cấu hình đề thi.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [exam.id]);

  const flash = (m: string) => {
    setMsg(m);
    setError(null);
  };

  const handleToggle = async () => {
    if (saving) return;
    const next = !showResult;
    setSaving(true);
    setError(null);
    try {
      const def = await setExamConfig(exam.id, { showResult: next });
      setShowResult(def.showResult);
      flash('Đã lưu cấu hình hiển thị điểm.');
    } catch {
      setError('Lưu cấu hình thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const handleSourceChange = async (nextMatrixId: string) => {
    if (savingSource) return;
    setSavingSource(true);
    setError(null);
    try {
      const def = await setExamConfig(exam.id, {
        examCoreMatrixId: nextMatrixId,
      });
      setMatrixId(def.examCoreMatrixId ?? '');
      flash(nextMatrixId ? 'Đã gắn ma trận đề.' : 'Đã gỡ liên kết ma trận.');
    } catch {
      setError('Lưu nguồn câu hỏi thất bại.');
    } finally {
      setSavingSource(false);
    }
  };

  const savePlay = async (patch: {
    maxAttempt?: number;
    shuffleQuestions?: boolean;
    shuffleAnswers?: boolean;
  }) => {
    if (savingPlay) return;
    setSavingPlay(true);
    setError(null);
    try {
      const def = await setExamConfig(exam.id, patch);
      setMaxAttempt(def.maxAttempt ?? maxAttempt);
      setShuffleQuestions(def.shuffleQuestions ?? shuffleQuestions);
      setShuffleAnswers(def.shuffleAnswers ?? shuffleAnswers);
      flash('Đã lưu cấu hình làm bài.');
    } catch {
      setError('Lưu cấu hình làm bài thất bại.');
    } finally {
      setSavingPlay(false);
    }
  };

  const handlePublish = async (mode: 'pub' | 'unpub') => {
    if (publishing) return;
    setPublishing(mode);
    setError(null);
    try {
      if (mode === 'pub') {
        const { published } = await publishResults(exam.id);
        flash(`Đã công bố ${published} kết quả.`);
      } else {
        const { unpublished } = await unpublishResults(exam.id);
        flash(`Đã gỡ công bố ${unpublished} kết quả.`);
      }
    } catch {
      setError('Thao tác công bố thất bại.');
    } finally {
      setPublishing(null);
    }
  };

  return (
    <div className="animate-[page-enter_0.3s_ease] flex flex-col gap-5">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[14px] font-semibold text-[var(--text-secondary)] hover:text-brand-600 transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" /> Quay lại danh sách đề thi
      </button>

      {/* Tiêu đề + thông tin nhanh */}
      <div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">
          {exam.title}
        </h2>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-1.5 text-[14px] text-[var(--text-secondary)]">
          <span className="flex items-center gap-1.5 font-semibold text-brand-600 dark:text-blue-400">
            <BookOpen className="w-4 h-4" /> {exam.code}
          </span>
          <span className="flex items-center gap-1.5">
            <Hash className="w-4 h-4" /> {exam.totalQuestions} câu
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" /> {exam.durationMinutes} phút
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm py-4">
          <Loader2 className="w-4 h-4 animate-spin" /> Đang tải cấu hình…
        </div>
      ) : (
        <>
          {/* Cấu hình hiện/ẩn điểm */}
          <GlassCard className="p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 ${showResult ? 'bg-emerald-500/12 text-emerald-600' : 'bg-slate-500/12 text-slate-500'}`}
              >
                {showResult ? (
                  <Eye className="w-[18px] h-[18px]" />
                ) : (
                  <EyeOff className="w-[18px] h-[18px]" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-[var(--text-primary)]">
                  Cho phép sinh viên xem điểm
                </p>
                <p className="text-[12px] text-[var(--text-secondary)]">
                  {showResult
                    ? 'SV thấy điểm + đáp án ngay sau khi nộp.'
                    : 'SV chỉ thấy thông báo hoàn thành.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={showResult}
              aria-label="Cho phép sinh viên xem điểm"
              onClick={handleToggle}
              disabled={saving}
              className={`relative shrink-0 inline-flex h-7 w-12 items-center rounded-full transition-colors disabled:opacity-60 ${showResult ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'}`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${showResult ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
          </GlassCard>

          {/* Nguồn câu hỏi (ma trận) */}
          <GlassCard className="p-5 flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 bg-blue-500/12 text-blue-600">
                <Database className="w-[18px] h-[18px]" />
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-[var(--text-primary)]">
                  Nguồn câu hỏi (ma trận đề)
                </p>
                <p className="text-[12px] text-[var(--text-secondary)]">
                  Gắn ma trận để rút đề theo section/độ khó. Bỏ chọn = nguồn mặc
                  định.
                </p>
              </div>
            </div>
            <select
              aria-label="Chọn ma trận đề"
              value={matrixId}
              disabled={savingSource}
              onChange={(e) => handleSourceChange(e.target.value)}
              className="w-full mt-1 px-3 py-2.5 rounded-[12px] text-[14px] bg-[var(--bg-glass)] border border-[var(--border-subtle)] text-[var(--text-primary)] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            >
              <option value="">— Nguồn mặc định (mock/bank) —</option>
              {matrices.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.courseNameText})
                </option>
              ))}
            </select>
            {savingSource && (
              <p className="flex items-center gap-1.5 text-[12px] text-[var(--text-secondary)]">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang lưu…
              </p>
            )}
          </GlassCard>

          {/* Cấu hình làm bài: số lần thi + trộn câu/đáp án */}
          <GlassCard className="p-5 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 bg-amber-500/12 text-amber-600">
                <Shuffle className="w-[18px] h-[18px]" />
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-[var(--text-primary)]">
                  Cấu hình làm bài
                </p>
                <p className="text-[12px] text-[var(--text-secondary)]">
                  Số lần thi tối đa và trộn thứ tự câu/đáp án.
                </p>
              </div>
            </div>

            {/* Số lần thi tối đa */}
            <div className="flex items-center justify-between gap-4 px-3 py-2.5 rounded-[12px] bg-[var(--bg-glass)] border border-[var(--border-subtle)]">
              <div className="flex items-center gap-2.5 min-w-0">
                <RefreshCw className="w-4 h-4 text-[var(--text-secondary)] shrink-0" />
                <span className="text-[13px] text-[var(--text-primary)]">
                  Số lần thi tối đa
                </span>
              </div>
              <input
                type="number"
                min={1}
                aria-label="Số lần thi tối đa"
                value={maxAttempt}
                disabled={savingPlay}
                onChange={(e) =>
                  setMaxAttempt(Math.max(1, Number(e.target.value) || 1))
                }
                onBlur={() => savePlay({ maxAttempt })}
                className="w-20 px-3 py-1.5 rounded-lg text-[14px] text-center bg-[var(--bg-glass-heavy)] border border-[var(--border-subtle)] text-[var(--text-primary)] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              />
            </div>

            {/* Trộn câu hỏi */}
            <div className="flex items-center justify-between gap-4">
              <span className="text-[13px] text-[var(--text-primary)]">
                Trộn thứ tự câu hỏi
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={shuffleQuestions}
                aria-label="Trộn thứ tự câu hỏi"
                disabled={savingPlay}
                onClick={() =>
                  savePlay({ shuffleQuestions: !shuffleQuestions })
                }
                className={`relative shrink-0 inline-flex h-7 w-12 items-center rounded-full transition-colors disabled:opacity-60 ${shuffleQuestions ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'}`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${shuffleQuestions ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
            </div>

            {/* Trộn đáp án */}
            <div className="flex items-center justify-between gap-4">
              <span className="text-[13px] text-[var(--text-primary)]">
                Trộn thứ tự đáp án
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={shuffleAnswers}
                aria-label="Trộn thứ tự đáp án"
                disabled={savingPlay}
                onClick={() => savePlay({ shuffleAnswers: !shuffleAnswers })}
                className={`relative shrink-0 inline-flex h-7 w-12 items-center rounded-full transition-colors disabled:opacity-60 ${shuffleAnswers ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'}`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${shuffleAnswers ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
            </div>
          </GlassCard>

          {/* Công bố kết quả */}
          <GlassCard className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[14px] font-semibold text-[var(--text-primary)]">
                Công bố kết quả
              </p>
              <p className="text-[12px] text-[var(--text-secondary)]">
                Công bố để SV xem được điểm (khi đã bật hiển thị); gỡ để ẩn lại.
              </p>
            </div>
            <div className="flex gap-3 shrink-0">
              <Button
                variant="primary"
                onClick={() => handlePublish('pub')}
                disabled={publishing !== null}
                className="px-4 py-2.5 gap-2 text-sm bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30 text-white border-0"
              >
                {publishing === 'pub' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Công bố
              </Button>
              <Button
                variant="secondary"
                onClick={() => handlePublish('unpub')}
                disabled={publishing !== null}
                className="px-4 py-2.5 gap-2 text-sm"
              >
                {publishing === 'unpub' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
                Gỡ công bố
              </Button>
            </div>
          </GlassCard>

          {msg && (
            <p className="flex items-center gap-1.5 text-[13px] font-medium text-emerald-600">
              <CheckCircle2 className="w-4 h-4" /> {msg}
            </p>
          )}
          {error && (
            <p className="flex items-center gap-1.5 text-[13px] font-medium text-rose-600">
              <AlertCircle className="w-4 h-4" /> {error}
            </p>
          )}
        </>
      )}
    </div>
  );
}
