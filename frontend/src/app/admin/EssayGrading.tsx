'use client';

import { useEffect, useState } from 'react';
import {
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Save,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { RichText } from '@/components/ui/RichText';
import {
  getExamDefinitions,
  getExamEssays,
  gradeEssay,
  type ExamDefinitionListItem,
  type EssayAttempt,
} from '@/services/api';

/**
 * Khảo thí CHẤM TỰ LUẬN: chọn đề → xem bài viết của thí sinh → nhập điểm (thang
 * 10 cho câu) → lưu (quy đổi 0..1, backend chấm lại tổng điểm).
 */
export function EssayGrading() {
  const [exams, setExams] = useState<ExamDefinitionListItem[]>([]);
  const [examId, setExamId] = useState('');
  const [attempts, setAttempts] = useState<EssayAttempt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // điểm nhập theo từng câu (thang 10) + trạng thái lưu, keyed "attemptId:questionId"
  const [scores, setScores] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [okKey, setOkKey] = useState<string | null>(null);

  useEffect(() => {
    getExamDefinitions()
      .then(setExams)
      .catch(() => setError('Không tải được danh sách đề.'));
  }, []);

  const loadEssays = async (id: string) => {
    setExamId(id);
    setAttempts([]);
    if (!id) return;
    setLoading(true);
    try {
      const list = await getExamEssays(id);
      setAttempts(list);
      const init: Record<string, string> = {};
      for (const a of list)
        for (const e of a.essays)
          init[`${a.attemptId}:${e.questionId}`] =
            e.manualCredit != null ? String(e.manualCredit * 10) : '';
      setScores(init);
      setError(null);
    } catch {
      setError('Không tải được bài tự luận.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (attemptId: string, questionId: string) => {
    const key = `${attemptId}:${questionId}`;
    const v = parseFloat((scores[key] ?? '').replace(',', '.'));
    if (isNaN(v) || v < 0 || v > 10) {
      setError('Điểm phải trong khoảng 0–10.');
      return;
    }
    setError(null);
    setSavingKey(key);
    try {
      await gradeEssay(attemptId, questionId, v / 10); // 0..1
      setOkKey(key);
      setTimeout(() => setOkKey((k) => (k === key ? null : k)), 1500);
    } catch {
      setError('Lưu điểm thất bại.');
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="animate-[page-enter_0.3s_ease] flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-500/12 text-amber-600">
          <FileText className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">
            Chấm tự luận
          </h2>
          <p className="text-[13px] text-[var(--text-secondary)]">
            Chọn đề, đọc bài viết của thí sinh và nhập điểm (thang 10).
          </p>
        </div>
      </div>

      <select
        aria-label="Chọn đề thi"
        value={examId}
        onChange={(e) => loadEssays(e.target.value)}
        className="w-full max-w-md px-3 py-2.5 rounded-[12px] text-[14px] bg-[var(--bg-glass)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand-500/40"
      >
        <option value="">— Chọn đề thi —</option>
        {exams.map((e) => (
          <option key={e.id} value={e.id}>
            {e.code} — {e.title}
          </option>
        ))}
      </select>

      {error && (
        <p className="flex items-center gap-1.5 text-[13px] font-medium text-rose-600">
          <AlertCircle className="w-4 h-4" /> {error}
        </p>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm py-4">
          <Loader2 className="w-4 h-4 animate-spin" /> Đang tải bài tự luận…
        </div>
      ) : examId && attempts.length === 0 ? (
        <GlassCard className="p-8 text-center text-[var(--text-secondary)]">
          Đề này chưa có bài tự luận nào được nộp.
        </GlassCard>
      ) : (
        <div className="flex flex-col gap-4">
          {attempts.map((a) => (
            <GlassCard key={a.attemptId} className="p-5 flex flex-col gap-4">
              <div className="flex items-center gap-2 text-[14px] font-bold text-[var(--text-primary)]">
                {a.studentName}
                <span className="text-[12px] font-medium text-[var(--text-secondary)]">
                  {a.studentCode}
                </span>
              </div>
              {a.essays.map((e) => {
                const key = `${a.attemptId}:${e.questionId}`;
                return (
                  <div
                    key={e.questionId}
                    className="flex flex-col gap-2 p-3 rounded-xl bg-[var(--bg-glass)] border border-[var(--border-subtle)]"
                  >
                    <RichText
                      text={e.content}
                      className="block text-[13px] font-semibold text-[var(--text-primary)]"
                    />
                    <div className="text-[13px] text-[var(--text-secondary)] whitespace-pre-wrap rounded-lg bg-[var(--bg-glass-light)] p-3 border border-[var(--border-subtle)]">
                      {e.answer || (
                        <em className="text-[var(--text-muted)]">
                          (Thí sinh không làm)
                        </em>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-[12px] text-[var(--text-secondary)]">
                        Điểm /10:
                      </label>
                      <input
                        aria-label="Điểm câu tự luận"
                        type="text"
                        inputMode="decimal"
                        value={scores[key] ?? ''}
                        onChange={(ev) =>
                          setScores((s) => ({ ...s, [key]: ev.target.value }))
                        }
                        placeholder="0–10"
                        className="w-24 px-3 py-1.5 rounded-lg text-[13px] bg-[var(--bg-glass)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                      />
                      <button
                        onClick={() => handleSave(a.attemptId, e.questionId)}
                        disabled={savingKey === key}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-60 transition-colors"
                      >
                        {savingKey === key ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                        Lưu
                      </button>
                      {okKey === key && (
                        <span className="inline-flex items-center gap-1 text-[12px] font-medium text-emerald-600">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Đã chấm
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
