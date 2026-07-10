'use client';

import { Grid3X3, Info, FileText, Bookmark, Send } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface QuestionNavProps {
  totalQuestions: number;
  currentQuestion: number;
  answeredQuestions: Set<number>;
  flaggedQuestions: Set<number>;
  onNavigate: (index: number) => void;
  examInfo?: {
    subjectCode: string;
    duration: number;
    totalQuestions: number;
    maxScore: number;
  };
  onSubmit: () => void;
}

export function QuestionNav({
  totalQuestions,
  currentQuestion,
  answeredQuestions,
  flaggedQuestions,
  onNavigate,
  examInfo,
  onSubmit,
}: QuestionNavProps) {
  const { user } = useAuth();

  return (
    <aside className="w-[320px] h-[calc(100vh-72px)] sticky top-[72px] right-0 bg-[var(--bg-glass)] backdrop-blur-[24px] border-l border-[var(--border-glass)] flex flex-col">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col">
        {/* Question Grid */}
        <div className="flex items-center gap-2 text-[13px] font-bold text-[var(--text-primary)] mb-3.5">
          <Grid3X3 className="w-4 h-4 text-brand-600 dark:text-blue-400" />
          Bảng câu hỏi
        </div>
        <div className="grid grid-cols-5 gap-2 mb-6">
          {Array.from({ length: totalQuestions }, (_, i) => {
            const isCurrent = i === currentQuestion;
            const isAnswered = answeredQuestions.has(i);
            const isFlagged = flaggedQuestions.has(i);

            let cellClass =
              'bg-[var(--bg-glass)] border-[1.5px] border-[var(--border-subtle)] text-[var(--text-secondary)]';

            if (isCurrent && isFlagged) {
              cellClass =
                'bg-[rgba(217,119,6,0.12)] text-[var(--color-warning)] border-[var(--color-warning)] scale-110 shadow-[0_2px_12px_rgba(217,119,6,0.3)] font-bold';
            } else if (isCurrent) {
              cellClass =
                'bg-gradient-to-br from-brand-600 to-brand-700 text-white border-2 border-brand-400 dark:border-blue-400 shadow-[0_2px_12px_rgba(37,99,235,0.3)] scale-110 font-bold';
            } else if (isFlagged) {
              cellClass =
                'bg-[rgba(217,119,6,0.12)] text-[var(--color-warning)] border-[rgba(217,119,6,0.3)]';
            } else if (isAnswered) {
              cellClass =
                'bg-[rgba(5,150,105,0.12)] text-[var(--color-accent)] border-[rgba(5,150,105,0.3)]';
            }

            return (
              <button
                key={i}
                onClick={() => onNavigate(i)}
                className={`aspect-square rounded-[10px] flex items-center justify-center text-[13px] font-semibold cursor-pointer transition-all duration-200 hover:border-brand-500 hover:scale-110 relative ${cellClass}`}
              >
                {i + 1}
                {isFlagged && (
                  <Bookmark className="absolute -top-1.5 -right-1 w-3 h-3 fill-amber-500 text-amber-500 drop-shadow-md" />
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 text-[13px] font-bold text-[var(--text-primary)] mb-3.5">
          <Info className="w-4 h-4 text-brand-600 dark:text-blue-400" />
          Chú thích
        </div>
        <div className="bg-[var(--bg-glass-heavy)] border border-[var(--border-subtle)] rounded-xl p-4 grid grid-cols-2 gap-x-3 gap-y-2.5">
          <LegendItem
            color="bg-[var(--bg-glass)] border border-[var(--border-subtle)]"
            label="Chưa làm"
          />
          <LegendItem
            color="bg-gradient-to-br from-brand-600 to-brand-700"
            label="Đang xem"
          />
          <LegendItem
            color="bg-[rgba(5,150,105,0.2)] border border-[rgba(5,150,105,0.3)]"
            label="Đã chọn"
          />
          <LegendItem
            color="bg-[rgba(217,119,6,0.2)] border border-[rgba(217,119,6,0.3)]"
            label="Đánh dấu"
          />
        </div>
      </div>

      {/* Fixed Submit Button at Bottom */}
      <div className="p-6 border-t border-[var(--border-subtle)] bg-[var(--bg-glass-heavy)]">
        <button
          onClick={onSubmit}
          className="w-full py-4 bg-gradient-to-br from-rose-600 to-rose-700 text-white text-[16px] font-bold rounded-2xl flex items-center justify-center gap-2.5 cursor-pointer transition-all duration-200 shadow-[0_8px_24px_rgba(225,29,72,0.3)] hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(225,29,72,0.4)] active:translate-y-0 active:scale-[0.97]"
        >
          <Send className="w-[18px] h-[18px]" /> NỘP BÀI THI
        </button>
      </div>
    </aside>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2.5 text-xs text-[var(--text-secondary)] font-medium">
      <div className={`w-4 h-4 rounded-[5px] flex-shrink-0 ${color}`} />
      {label}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-[13px] py-1.5 text-[var(--text-secondary)]">
      <span>{label}</span>
      <span className="font-semibold text-[var(--text-primary)]">{value}</span>
    </div>
  );
}
