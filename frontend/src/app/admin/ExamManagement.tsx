'use client';

import { useEffect, useState } from 'react';
import {
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  Eye,
  EyeOff,
  Database,
  ChevronRight,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ExamDetail } from './ExamDetail';
import {
  getExamDefinitions,
  createExamDefinition,
  type ExamDefinitionListItem,
} from '@/services/api';

/** Chip nguồn câu hỏi của một đề (màu + nhãn thân thiện, không xuống dòng). */
function SourceBadge({ e }: { e: ExamDefinitionListItem }) {
  const cfg = e.examCoreMatrixId
    ? {
        text: 'Ma trận đề',
        cls: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
      }
    : e.examCoreBankId
      ? {
          text: 'Ngân hàng',
          cls: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
        }
      : {
          text: 'Mock nội bộ',
          cls: 'bg-slate-100 text-slate-600 dark:bg-slate-700/40 dark:text-slate-300',
        };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${cfg.cls}`}
    >
      <Database className="w-3 h-3 shrink-0" /> {cfg.text}
    </span>
  );
}

/**
 * Quản lý Đề thi (admin/khảo thí) — danh sách THẬT + tạo đề mới.
 * Thay bảng mock cũ trong tab "Ngân hàng Đề thi".
 */
export function ExamManagement() {
  const [exams, setExams] = useState<ExamDefinitionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ExamDefinitionListItem | null>(null);

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [form, setForm] = useState({
    code: '',
    title: '',
    durationMinutes: 60,
    totalQuestions: 10,
  });

  const load = async () => {
    setLoading(true);
    try {
      setExams(await getExamDefinitions());
      setError(null);
    } catch {
      setError('Không tải được danh sách đề thi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleCreate = async () => {
    if (saving) return;
    setFormError(null);
    if (!form.code.trim() || !form.title.trim()) {
      setFormError('Vui lòng nhập mã đề và tên đề.');
      return;
    }
    if (form.durationMinutes < 1 || form.totalQuestions < 1) {
      setFormError('Thời lượng và số câu phải ≥ 1.');
      return;
    }
    setSaving(true);
    try {
      await createExamDefinition({
        code: form.code.trim(),
        title: form.title.trim(),
        durationMinutes: Number(form.durationMinutes),
        totalQuestions: Number(form.totalQuestions),
      });
      setOpen(false);
      setForm({ code: '', title: '', durationMinutes: 60, totalQuestions: 10 });
      setOkMsg('Đã tạo đề thi mới.');
      await load();
    } catch {
      setFormError('Tạo đề thất bại (mã đề có thể đã tồn tại).');
    } finally {
      setSaving(false);
    }
  };

  // Chi tiết MỘT đề — quay lại thì tải lại danh sách (phản ánh cấu hình mới).
  if (selected) {
    return (
      <ExamDetail
        exam={selected}
        onBack={() => {
          setSelected(null);
          void load();
        }}
      />
    );
  }

  return (
    <div className="animate-[page-enter_0.3s_ease] flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">
          Ngân hàng Đề thi
        </h2>
        <Button
          variant="primary"
          onClick={() => {
            setOkMsg(null);
            setOpen(true);
          }}
          className="px-4 py-2 gap-2 text-sm"
        >
          <Plus className="w-4 h-4" /> Tạo Đề Thi
        </Button>
      </div>

      {okMsg && (
        <p className="flex items-center gap-1.5 text-[13px] font-medium text-emerald-600">
          <CheckCircle2 className="w-4 h-4" /> {okMsg}
        </p>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm py-6">
          <Loader2 className="w-4 h-4 animate-spin" /> Đang tải danh sách đề…
        </div>
      ) : error ? (
        <p className="flex items-center gap-1.5 text-[13px] font-medium text-rose-600 py-4">
          <AlertCircle className="w-4 h-4" /> {error}
        </p>
      ) : exams.length === 0 ? (
        <GlassCard className="p-8 flex flex-col items-center text-center">
          <BookOpen className="w-12 h-12 text-[var(--text-muted)] mb-3" />
          <p className="text-[var(--text-secondary)]">
            Chưa có đề thi nào. Bấm “Tạo Đề Thi” để thêm.
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
                  <th className="p-4 text-center">Số câu</th>
                  <th className="p-4 text-center">Thời lượng</th>
                  <th className="p-4">Nguồn câu hỏi</th>
                  <th className="p-4 text-center">Xem điểm</th>
                  <th className="p-4 pr-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-[13px]">
                {exams.map((e) => (
                  <tr
                    key={e.id}
                    onClick={() => {
                      setOkMsg(null);
                      setSelected(e);
                    }}
                    className="hover:bg-[var(--bg-glass-light)] transition-colors cursor-pointer"
                  >
                    <td className="p-4 pl-6 text-[13px] font-semibold text-brand-600 dark:text-blue-400">
                      {e.code}
                    </td>
                    <td className="p-4 text-[13px] font-medium text-[var(--text-primary)]">
                      {e.title}
                    </td>
                    <td className="p-4 text-center text-[var(--text-secondary)]">
                      {e.totalQuestions}
                    </td>
                    <td className="p-4 text-center text-[var(--text-secondary)]">
                      {e.durationMinutes}′
                    </td>
                    <td className="p-4">
                      <SourceBadge e={e} />
                    </td>
                    <td className="p-4 text-center">
                      {e.showResult ? (
                        <Eye className="w-4 h-4 text-emerald-500 inline" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-slate-400 inline" />
                      )}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand-600 dark:text-blue-400">
                        Cấu hình <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Tạo Đề Thi mới"
      >
        <div className="flex flex-col gap-4">
          <Field label="Mã đề">
            <input
              aria-label="Mã đề"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="VD: CS101-CK-2026"
              className="w-full px-3 py-2.5 rounded-[12px] text-[14px] bg-[var(--bg-glass)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            />
          </Field>
          <Field label="Tên đề">
            <input
              aria-label="Tên đề"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="VD: Cơ sở lập trình — Cuối kỳ"
              className="w-full px-3 py-2.5 rounded-[12px] text-[14px] bg-[var(--bg-glass)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Thời lượng (phút)">
              <input
                aria-label="Thời lượng (phút)"
                type="number"
                min={1}
                value={form.durationMinutes}
                onChange={(e) =>
                  setForm({ ...form, durationMinutes: Number(e.target.value) })
                }
                className="w-full px-3 py-2.5 rounded-[12px] text-[14px] bg-[var(--bg-glass)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              />
            </Field>
            <Field label="Số câu">
              <input
                aria-label="Số câu"
                type="number"
                min={1}
                value={form.totalQuestions}
                onChange={(e) =>
                  setForm({ ...form, totalQuestions: Number(e.target.value) })
                }
                className="w-full px-3 py-2.5 rounded-[12px] text-[14px] bg-[var(--bg-glass)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              />
            </Field>
          </div>

          {formError && (
            <p className="flex items-center gap-1.5 text-[13px] font-medium text-rose-600">
              <AlertCircle className="w-4 h-4" /> {formError}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setOpen(false)}
              className="px-4 py-2 text-sm"
            >
              Huỷ
            </Button>
            <Button
              variant="primary"
              onClick={handleCreate}
              disabled={saving}
              className="px-5 py-2 gap-2 text-sm"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Tạo đề
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-[var(--text-secondary)]">
        {label}
      </span>
      {children}
    </label>
  );
}
