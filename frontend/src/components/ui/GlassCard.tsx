import { type ReactNode, type HTMLAttributes } from 'react';

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'heavy' | 'light';
  hover?: boolean;
}

export function GlassCard({
  children,
  className = '',
  variant = 'default',
  hover = true,
  ...props
}: GlassCardProps) {
  const variantClass = variant === 'heavy' ? 'glass-heavy' : 'glass';

  return (
    <div
      {...props}
      className={`${variantClass} p-6 ${
        hover
          ? 'transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg'
          : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}
