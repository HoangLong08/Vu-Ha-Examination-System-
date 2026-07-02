import { type ReactNode, type ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseClass =
    'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 cursor-pointer active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none';

  const variants = {
    primary:
      'bg-gradient-to-br from-brand-600 to-brand-700 text-white shadow-[0_4px_16px_rgba(37,99,235,0.3)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(37,99,235,0.4)]',
    secondary:
      'glass-btn text-[var(--text-primary)] hover:bg-[var(--bg-glass-heavy)]',
    danger:
      'bg-gradient-to-br from-rose-600 to-rose-700 text-white shadow-[0_4px_16px_rgba(225,29,72,0.3)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(225,29,72,0.4)]',
    ghost:
      'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--nav-hover-bg)]',
  };

  const sizes = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-8 py-3.5 text-base',
  };

  return (
    <button
      className={`${baseClass} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
