'use client';

import { useAuth } from '@/context/AuthContext';
import { User, Mail, BookOpen, FileText } from 'lucide-react';

interface StudentExamSidebarProps {
  examInfo?: {
    subjectCode: string;
    duration: number;
    totalQuestions: number;
    maxScore: number;
  };
  answeredCount?: number;
}

export function StudentExamSidebar({
  examInfo,
  answeredCount,
}: StudentExamSidebarProps) {
  const { user } = useAuth();

  return (
    <aside className="w-[280px] h-[calc(100vh-72px)] sticky top-[72px] left-0 bg-[var(--bg-glass)] backdrop-blur-[24px] border-r border-[var(--border-glass)] flex flex-col p-6 overflow-y-auto">
      <div className="flex flex-col items-center text-center mb-8 mt-2">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-3xl shadow-lg border-4 border-[var(--bg-glass)] mb-3 overflow-hidden relative">
          <div className="absolute inset-0 bg-white/10" />
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            user?.firstName?.charAt(0) || 'U'
          )}
        </div>
        <h3 className="text-[16px] font-bold text-[var(--text-primary)] leading-tight mb-1">
          {user?.lastName} {user?.firstName}
        </h3>
        <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400">
          Thí sinh
        </span>
      </div>

      <div className="flex flex-col gap-3 mb-6">
        <div className="bg-[var(--bg-glass-heavy)] border border-[var(--border-subtle)] rounded-xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 flex-shrink-0">
            <User className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-semibold mb-0.5">
              Mã sinh viên
            </p>
            <p className="text-[13px] font-bold text-[var(--text-primary)] truncate">
              SV21103011
            </p>
          </div>
        </div>

        <div className="bg-[var(--bg-glass-heavy)] border border-[var(--border-subtle)] rounded-xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 flex-shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-semibold mb-0.5">
              Lớp sinh hoạt
            </p>
            <p className="text-[13px] font-bold text-[var(--text-primary)] truncate">
              {user?.studentInfo?.classId || '21CT111'}
            </p>
          </div>
        </div>
      </div>

      {/* Exam Info */}
      {examInfo && (
        <div className="mt-auto">
          <div className="flex items-center gap-2 text-[13px] font-bold text-[var(--text-primary)] mb-3.5">
            <FileText className="w-4 h-4 text-brand-600 dark:text-blue-400" />
            Thông tin đề thi
          </div>
          <div className="bg-[var(--bg-glass-heavy)] border border-[var(--border-subtle)] rounded-xl p-4">
            <InfoRow label="Môn thi" value={examInfo.subjectCode} />
            <InfoRow label="Thời gian" value={`${examInfo.duration} phút`} />
            <InfoRow
              label="Tổng câu"
              value={`${examInfo.totalQuestions} câu`}
            />
            <InfoRow label="Điểm tối đa" value={String(examInfo.maxScore)} />
            {answeredCount !== undefined && (
              <InfoRow
                label="Đã chọn"
                value={`${answeredCount} / ${examInfo.totalQuestions}`}
              />
            )}
          </div>
        </div>
      )}
    </aside>
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
