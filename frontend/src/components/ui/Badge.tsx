import { type ReactNode } from 'react';

type BadgeVariant =
  'active' | 'upcoming' | 'completed' | 'ended' | 'easy' | 'medium' | 'hard';

interface BadgeProps {
  children: ReactNode;
  variant: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  active: 'bg-[var(--color-accent-light)] text-[var(--color-accent)]',
  upcoming: 'bg-[var(--color-warning-light)] text-[var(--color-warning)]',
  completed: 'bg-brand-50 text-brand-600 dark:bg-[rgba(59,130,246,0.15)]',
  ended: 'bg-[var(--bg-glass-light)] text-[var(--text-muted)]',
  easy: 'bg-[rgba(5,150,105,0.1)] text-[var(--color-accent)]',
  medium: 'bg-[rgba(217,119,6,0.1)] text-[var(--color-warning)]',
  hard: 'bg-[rgba(225,29,72,0.1)] text-[var(--color-danger)]',
};

export function Badge({ children, variant, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
