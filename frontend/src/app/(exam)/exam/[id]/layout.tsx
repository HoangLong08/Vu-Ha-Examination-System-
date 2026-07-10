import { type ReactNode } from 'react';

export default function ExamLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen relative z-[1]">{children}</div>
  );
}
