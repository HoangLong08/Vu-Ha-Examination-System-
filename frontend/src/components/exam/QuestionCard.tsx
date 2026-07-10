'use client';

import type { MouseEvent } from 'react';
import {
  CircleDot,
  CheckSquare,
  ToggleLeft,
  Check,
  PenLine,
  Hash,
  FileText,
  ArrowRightLeft,
  ListOrdered,
  FolderTree,
  MousePointerClick,
} from 'lucide-react';
import { RichText } from '@/components/ui/RichText';

interface Option {
  key: string;
  value: string;
}

type QType =
  | 'SINGLE_CHOICE'
  | 'MULTIPLE_CHOICE'
  | 'TRUE_FALSE'
  | 'FILL_BLANK'
  | 'NUMERIC'
  | 'ESSAY'
  | 'MATCHING'
  | 'ORDERING'
  | 'CLASSIFY'
  | 'HOTSPOT';

interface QuestionCardProps {
  questionNumber: number;
  totalQuestions: number;
  type: QType;
  difficulty: string;
  content: string;
  options: Option[];
  selectedAnswers: string[];
  onSelectAnswer: (key: string) => void;
  /** Cho câu nhập text (điền khuyết / điền giá trị / tự luận) + gán mục→đích. */
  onTextAnswer?: (text: string) => void;
  /** Câu gán mục→đích (đối sánh / sắp thứ tự / phân loại). */
  items?: Option[];
  targets?: Option[];
  /** Optional media (image / video / audio) attached to the question. */
  mediaUrl?: string | null;
  mediaType?: 'IMAGE' | 'VIDEO' | 'AUDIO' | string | null;
}

const difficultyMap: Record<string, { label: string; color: string }> = {
  DE: { label: 'Dễ', color: 'var(--color-accent)' },
  TRUNG_BINH: { label: 'Trung bình', color: 'var(--color-warning)' },
  KHO: { label: 'Khó', color: 'var(--color-danger)' },
};

const typeConfig = {
  SINGLE_CHOICE: {
    label: 'Một đáp án',
    icon: CircleDot,
    badge:
      'bg-[rgba(59,130,246,0.1)] text-brand-600 dark:bg-[rgba(59,130,246,0.15)] dark:text-blue-400',
  },
  MULTIPLE_CHOICE: {
    label: 'Nhiều đáp án',
    icon: CheckSquare,
    badge:
      'bg-[rgba(5,150,105,0.1)] text-[var(--color-accent)] dark:bg-[rgba(5,150,105,0.15)]',
  },
  TRUE_FALSE: {
    label: 'Đúng / Sai',
    icon: ToggleLeft,
    badge:
      'bg-[rgba(217,119,6,0.1)] text-[var(--color-warning)] dark:bg-[rgba(217,119,6,0.15)]',
  },
  FILL_BLANK: {
    label: 'Điền khuyết',
    icon: PenLine,
    badge:
      'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  },
  NUMERIC: {
    label: 'Điền giá trị',
    icon: Hash,
    badge: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300',
  },
  ESSAY: {
    label: 'Tự luận',
    icon: FileText,
    badge:
      'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  },
  MATCHING: {
    label: 'Đối sánh',
    icon: ArrowRightLeft,
    badge:
      'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  },
  ORDERING: {
    label: 'Sắp thứ tự',
    icon: ListOrdered,
    badge: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300',
  },
  CLASSIFY: {
    label: 'Phân loại',
    icon: FolderTree,
    badge:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  },
  HOTSPOT: {
    label: 'Chọn vùng ảnh',
    icon: MousePointerClick,
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  },
};

export function QuestionCard({
  questionNumber,
  totalQuestions,
  type,
  difficulty,
  content,
  options,
  selectedAnswers,
  onSelectAnswer,
  onTextAnswer,
  items = [],
  targets = [],
  mediaUrl,
  mediaType,
}: QuestionCardProps) {
  const config = typeConfig[type] || typeConfig.SINGLE_CHOICE;
  const Icon = config.icon;
  const diff = difficultyMap[difficulty] || difficultyMap.DE;
  const isText = type === 'FILL_BLANK' || type === 'NUMERIC';
  const isEssay = type === 'ESSAY';
  const isAssign =
    type === 'MATCHING' || type === 'ORDERING' || type === 'CLASSIFY';
  const isHotspot = type === 'HOTSPOT';
  const isSingle = type === 'SINGLE_CHOICE' || type === 'TRUE_FALSE';

  // Câu chọn vùng ảnh: đáp án = các điểm click "x,y;x,y" (chuẩn hoá 0..1).
  const hotspotPoints: [number, number][] = (selectedAnswers[0] ?? '')
    .split(';')
    .map((p) => p.split(',').map(Number) as [number, number])
    .filter((p) => p.length === 2 && p.every((n) => !isNaN(n)));
  const round = (n: number) => Math.round(n * 1e4) / 1e4;
  const addHotspotPoint = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = round((e.clientX - rect.left) / rect.width);
    const y = round((e.clientY - rect.top) / rect.height);
    const next = [...hotspotPoints, [x, y]];
    onTextAnswer?.(next.map((p) => p.join(',')).join(';'));
  };
  const removeHotspotPoint = (idx: number) => {
    const next = hotspotPoints.filter((_, i) => i !== idx);
    onTextAnswer?.(next.map((p) => p.join(',')).join(';'));
  };

  // Câu gán mục→đích: đáp án mã hoá "I1:T2,I2:T1". Parse để hiển thị + cập nhật.
  const assignMap = new Map(
    (selectedAnswers[0] ?? '')
      .split(',')
      .map((p) => p.split(':'))
      .filter((x) => x.length === 2) as [string, string][],
  );
  const setAssign = (itemKey: string, targetKey: string) => {
    const m = new Map(assignMap);
    if (targetKey) m.set(itemKey, targetKey);
    else m.delete(itemKey);
    onTextAnswer?.([...m].map(([k, v]) => `${k}:${v}`).join(','));
  };
  // For single-selection questions, only the first key in selectedAnswers is
  // honored so the UI can never display two simultaneously "selected" radios.
  const effectiveSelected = isSingle
    ? selectedAnswers.slice(0, 1)
    : selectedAnswers;

  return (
    <div className="glass p-9 rounded-[20px] w-full max-w-[800px] animate-[page-enter_0.3s_ease]">
      {/* Type Badge */}
      <span
        className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-[10px] text-xs font-bold mb-4 ${config.badge}`}
      >
        <Icon className="w-3.5 h-3.5" />
        {config.label}
      </span>

      {/* Question Number */}
      <div className="text-[13px] font-semibold text-[var(--text-secondary)] mb-2.5">
        Câu hỏi {questionNumber} / {totalQuestions} —{' '}
        <span style={{ color: diff.color }}>{diff.label}</span>
      </div>

      {/* Question Content (HTML + công thức toán) */}
      <RichText
        text={content}
        className="block text-base leading-[1.7] text-[var(--text-primary)] mb-7"
      />

      {/* Question Media (image / video / audio) */}
      {mediaUrl && mediaType === 'VIDEO' && (
        <video
          controls
          src={mediaUrl}
          aria-label="Video câu hỏi"
          className="max-w-full h-auto rounded-[14px] mb-7 border border-[var(--border-subtle)]"
        >
          Trình duyệt của bạn không hỗ trợ phát video.
        </video>
      )}
      {mediaUrl && mediaType === 'AUDIO' && (
        <audio
          controls
          src={mediaUrl}
          aria-label="Âm thanh câu hỏi"
          className="w-full mb-7"
        >
          Trình duyệt của bạn không hỗ trợ phát âm thanh.
        </audio>
      )}
      {mediaUrl &&
        !isHotspot &&
        (mediaType == null || mediaType === 'IMAGE') && (
          <img
            src={mediaUrl}
            alt="Hình ảnh câu hỏi"
            className="max-w-full h-auto rounded-[14px] mb-7 border border-[var(--border-subtle)]"
          />
        )}

      {/* Ô nhập bài viết (tự luận) */}
      {isEssay ? (
        <div className="flex flex-col gap-2">
          <textarea
            aria-label="Bài làm tự luận"
            value={selectedAnswers[0] ?? ''}
            onChange={(e) => onTextAnswer?.(e.target.value)}
            placeholder="Nhập bài làm của bạn…"
            rows={8}
            className="w-full px-4 py-3 rounded-[14px] bg-[var(--bg-glass)] border-[1.5px] border-[var(--border-subtle)] text-[15px] leading-relaxed text-[var(--text-primary)] focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 transition-colors resize-y"
          />
          <p className="text-[12px] text-[var(--text-secondary)]">
            Câu tự luận sẽ được <strong>giảng viên/khảo thí chấm tay</strong>{' '}
            sau khi nộp.
          </p>
        </div>
      ) : isText ? (
        <input
          aria-label="Câu trả lời"
          type={type === 'NUMERIC' ? 'text' : 'text'}
          inputMode={type === 'NUMERIC' ? 'decimal' : 'text'}
          value={selectedAnswers[0] ?? ''}
          onChange={(e) => onTextAnswer?.(e.target.value)}
          placeholder={
            type === 'NUMERIC' ? 'Nhập giá trị (số)…' : 'Nhập câu trả lời…'
          }
          className="w-full px-4 py-3 rounded-[14px] bg-[var(--bg-glass)] border-[1.5px] border-[var(--border-subtle)] text-[15px] text-[var(--text-primary)] focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 transition-colors"
        />
      ) : isHotspot ? (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-[var(--text-secondary)]">
              Click vào ảnh để <strong>chỉ vị trí</strong> — đã chọn{' '}
              <strong>{hotspotPoints.length}</strong> điểm. Click lại dấu để
              xoá.
            </p>
            {hotspotPoints.length > 0 && (
              <button
                type="button"
                onClick={() => onTextAnswer?.('')}
                className="text-[13px] font-semibold text-[var(--color-danger)] hover:underline"
              >
                Xoá hết
              </button>
            )}
          </div>
          <div
            role="button"
            tabIndex={0}
            aria-label="Vùng chọn trên ảnh — click để đánh dấu vị trí"
            onClick={addHotspotPoint}
            className="relative inline-block w-full max-w-[640px] mx-auto cursor-crosshair select-none rounded-[14px] overflow-hidden border border-[var(--border-subtle)]"
          >
            <img
              src={mediaUrl ?? ''}
              alt="Ảnh chọn vùng"
              draggable={false}
              className="block w-full h-auto pointer-events-none"
            />
            {hotspotPoints.map(([x, y], idx) => (
              <button
                key={`${x}-${y}-${idx}`}
                type="button"
                aria-label={`Điểm đã chọn ${idx + 1}`}
                onClick={(e) => {
                  e.stopPropagation();
                  removeHotspotPoint(idx);
                }}
                style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-rose-500/90 border-2 border-white text-white text-[12px] font-bold flex items-center justify-center shadow-lg hover:bg-rose-600"
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>
      ) : isAssign ? (
        <div className="flex flex-col gap-2.5">
          {items.map((item) => (
            <div
              key={item.key}
              className="flex items-center gap-3 px-[18px] py-3 rounded-[14px] bg-[var(--bg-glass)] border-[1.5px] border-[var(--border-subtle)]"
            >
              <RichText
                text={item.value}
                className="flex-1 text-[15px] text-[var(--text-primary)]"
              />
              <ArrowRightLeft className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
              <select
                aria-label={`Chọn cho: ${item.value}`}
                value={assignMap.get(item.key) ?? ''}
                onChange={(e) => setAssign(item.key, e.target.value)}
                className="min-w-[160px] px-3 py-2 rounded-lg text-[14px] bg-[var(--bg-glass-heavy)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              >
                <option value="">— Chọn —</option>
                {targets.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.value}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="flex flex-col gap-2.5"
          role={isSingle ? 'radiogroup' : 'group'}
        >
          {options.map((option) => {
            const isSelected = effectiveSelected.includes(option.key);
            return (
              <button
                key={option.key}
                type="button"
                aria-checked={isSelected}
                data-selection-mode={isSingle ? 'single' : 'multiple'}
                onClick={() => onSelectAnswer(option.key)}
                className={`flex items-start gap-3.5 px-[18px] py-4 rounded-[14px] cursor-pointer select-none transition-all duration-200 text-left
                ${
                  isSelected
                    ? 'bg-[var(--option-selected)] border-[1.5px] border-[var(--option-border-selected)] shadow-[0_0_0_3px_rgba(37,99,235,0.08)]'
                    : 'bg-[var(--bg-glass)] border-[1.5px] border-[var(--border-subtle)] hover:bg-[var(--option-hover)] hover:border-[rgba(37,99,235,0.2)] hover:translate-x-1'
                }`}
              >
                {/* Radio / Checkbox Indicator */}
                <div
                  className={`w-[22px] h-[22px] flex-shrink-0 mt-0.5 flex items-center justify-center transition-all duration-200
                  ${
                    isSingle
                      ? `rounded-full border-2 ${
                          isSelected
                            ? 'border-brand-600 bg-brand-600'
                            : 'border-[var(--border-subtle)]'
                        }`
                      : `rounded-[6px] border-2 ${
                          isSelected
                            ? 'border-brand-600 bg-brand-600'
                            : 'border-[var(--border-subtle)]'
                        }`
                  }`}
                >
                  {isSelected &&
                    (isSingle ? (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    ) : (
                      <Check
                        className="w-3.5 h-3.5 text-white"
                        strokeWidth={3}
                      />
                    ))}
                </div>
                <span className="font-bold text-sm text-[var(--text-secondary)] min-w-[12px]">
                  {option.key}.
                </span>
                <RichText
                  text={option.value}
                  className="text-[15px] leading-relaxed text-[var(--text-primary)]"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
