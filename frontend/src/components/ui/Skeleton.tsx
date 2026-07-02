interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

export function Skeleton({ className = '', width, height }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="glass p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="w-12 h-12 rounded-[14px]" />
        <Skeleton className="w-20 h-6 rounded-full" />
      </div>
      <Skeleton className="w-3/4 h-5 rounded" />
      <Skeleton className="w-1/2 h-4 rounded" />
      <div className="flex gap-4 pt-3 border-t border-[var(--border-subtle)]">
        <Skeleton className="w-16 h-4 rounded" />
        <Skeleton className="w-16 h-4 rounded" />
        <Skeleton className="w-16 h-4 rounded" />
      </div>
      <div className="flex justify-between items-center pt-3">
        <Skeleton className="w-32 h-4 rounded" />
        <Skeleton className="w-24 h-10 rounded-xl" />
      </div>
    </div>
  );
}
