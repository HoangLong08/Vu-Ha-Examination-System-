'use client';

import { Modal } from '@/components/ui/Modal';
import { AlertTriangle, CheckCircle2, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface SubmitConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  answeredCount: number;
  totalQuestions: number;
}

export function SubmitConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  answeredCount,
  totalQuestions,
}: SubmitConfirmModalProps) {
  const unansweredCount = totalQuestions - answeredCount;
  const isAllAnswered = unansweredCount === 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="p-0 overflow-hidden max-w-lg"
    >
      <div className="p-8">
        <div className="flex flex-col items-center text-center">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-lg ${
              isAllAnswered
                ? 'bg-emerald-500/10 text-emerald-500 shadow-emerald-500/20'
                : 'bg-amber-500/10 text-amber-500 shadow-amber-500/20'
            }`}
          >
            {isAllAnswered ? (
              <CheckCircle2 className="w-10 h-10" />
            ) : (
              <AlertTriangle className="w-10 h-10" />
            )}
          </div>

          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-3">
            Xác nhận nộp bài
          </h2>

          {isAllAnswered ? (
            <p className="text-[15px] text-[var(--text-secondary)] mb-8">
              Tuyệt vời! Bạn đã hoàn thành toàn bộ{' '}
              <strong>{totalQuestions}</strong> câu hỏi. Bạn có chắc chắn muốn
              nộp bài ngay bây giờ?
            </p>
          ) : (
            <div className="mb-8">
              <p className="text-[15px] text-[var(--text-secondary)] mb-4">
                Bạn vẫn còn <strong>{unansweredCount}</strong> câu hỏi chưa chọn
                đáp án. Bạn có thực sự muốn nộp bài lúc này?
              </p>
              <div className="flex items-center justify-center gap-4 text-[14px]">
                <div className="flex flex-col items-center p-3 rounded-xl bg-[var(--bg-glass-light)] border border-[var(--border-subtle)] w-28">
                  <span className="font-bold text-emerald-500 text-lg">
                    {answeredCount}
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-wide">
                    Đã làm
                  </span>
                </div>
                <div className="flex flex-col items-center p-3 rounded-xl bg-[var(--bg-glass-light)] border border-amber-500/30 w-28">
                  <span className="font-bold text-amber-500 text-lg">
                    {unansweredCount}
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-wide">
                    Chưa làm
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 mt-2">
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1 py-3 text-[15px]"
          >
            Tiếp tục làm bài
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            className={`flex-1 py-3 text-[15px] gap-2 border-0 shadow-lg ${
              isAllAnswered
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 shadow-emerald-500/30 hover:shadow-emerald-500/50'
                : 'bg-gradient-to-r from-brand-600 to-brand-700 shadow-brand-500/30 hover:shadow-brand-500/50'
            }`}
          >
            <Send className="w-4 h-4" /> Nộp bài ngay
          </Button>
        </div>
      </div>
    </Modal>
  );
}
