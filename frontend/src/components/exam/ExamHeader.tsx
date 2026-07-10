'use client';

import { Maximize } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { Timer } from './Timer';

interface ExamHeaderProps {
  currentQuestion: number;
  totalQuestions: number;
  timerSeconds: number;
  onTimeUp?: () => void;
}

export function ExamHeader({
  currentQuestion,
  totalQuestions,
  timerSeconds,
  onTimeUp,
}: ExamHeaderProps) {
  const handleFullscreen = () => {
    document.documentElement.requestFullscreen?.();
  };

  return (
    <header className="glass-header sticky top-0 z-50 h-[72px] flex items-center justify-between px-6">
      {/* Left — thương hiệu (đồng bộ với cổng sinh viên) */}
      <div className="flex items-center gap-3.5 flex-1">
        <BrandLogo size={38} bare />
        <div className="min-w-0">
          <h2 className="text-[15px] font-bold text-[var(--text-primary)] leading-tight truncate">
            DAU Exam
          </h2>
          <p className="text-[11px] text-[var(--text-secondary)] font-medium tracking-wide uppercase truncate">
            Hệ thống trắc nghiệm
          </p>
        </div>
      </div>

      {/* Center */}
      <div className="flex items-center gap-6 justify-center flex-1">
        <Timer initialSeconds={timerSeconds} onTimeUp={onTimeUp} />
        <div className="text-[13px] text-[var(--text-secondary)] font-semibold hidden sm:block">
          Câu{' '}
          <span className="text-brand-600 dark:text-blue-400">
            {currentQuestion}
          </span>{' '}
          / <span>{totalQuestions}</span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2.5 justify-end flex-1">
        <ThemeToggle />
        <button
          onClick={handleFullscreen}
          className="glass-btn p-2 rounded-[10px] hover:scale-105 active:scale-95 transition-all cursor-pointer"
          aria-label="Toàn màn hình"
        >
          <Maximize className="w-[18px] h-[18px] text-[var(--text-secondary)]" />
        </button>
      </div>
    </header>
  );
}
