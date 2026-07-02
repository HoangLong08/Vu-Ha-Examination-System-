'use client';

import { Clock } from 'lucide-react';
import { useEffect, useState } from 'react';

interface TimerProps {
  initialSeconds: number;
  onTimeUp?: () => void;
}

export function Timer({ initialSeconds, onTimeUp }: TimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    if (seconds <= 0) {
      onTimeUp?.();
      return;
    }
    const interval = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          onTimeUp?.();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [seconds <= 0, onTimeUp]);

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const isWarning = seconds <= 300; // 5 minutes

  return (
    <div
      className={`flex items-center gap-2.5 glass-btn px-[18px] py-2 rounded-[14px] ${
        isWarning ? 'border-[rgba(225,29,72,0.3)] animate-[pulse-danger_1s_ease-in-out_infinite]' : ''
      }`}
    >
      <Clock
        className={`w-5 h-5 ${
          isWarning ? 'text-[var(--color-danger)]' : 'text-brand-600 dark:text-blue-400'
        }`}
      />
      <div
        className={`font-mono text-[22px] font-bold tracking-wider min-w-[72px] text-center ${
          isWarning ? 'text-[var(--color-danger)]' : 'text-[var(--text-primary)]'
        }`}
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {String(minutes).padStart(2, '0')}:{String(secs).padStart(2, '0')}
      </div>
    </div>
  );
}
