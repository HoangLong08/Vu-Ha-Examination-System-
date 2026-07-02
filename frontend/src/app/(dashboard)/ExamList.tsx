'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Clock,
  HelpCircle,
  Play,
  BookOpen,
  Loader2,
  AlertCircle,
  ClipboardList,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { getExamDefinitions, type ExamDefinitionListItem } from '@/services/api';

/**
 * Danh sách đề thi THẬT của sinh viên — lấy từ GET /exam-definitions.
 * Mỗi đề là một card, bấm "Vào thi ngay" mở /exam/[id].
 */
export function ExamList() {
  const [exams, setExams] = useState<ExamDefinitionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const list = await getExamDefinitions();
        if (active) setExams(list);
      } catch {
        if (active) setError('Không tải được danh sách đề thi.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm py-6">
        <Loader2 className="w-4 h-4 animate-spin" /> Đang tải danh sách đề thi…
      </div>
    );
  }

  if (error) {
    return (
      <p className="flex items-center gap-1.5 text-[13px] font-medium text-rose-600 py-4">
        <AlertCircle className="w-4 h-4" /> {error}
      </p>
    );
  }

  if (exams.length === 0) {
    return (
      <GlassCard className="p-8 flex flex-col items-center text-center">
        <ClipboardList className="w-12 h-12 text-[var(--text-muted)] mb-3" />
        <p className="text-[var(--text-secondary)]">
          Hiện chưa có đề thi nào dành cho bạn.
        </p>
      </GlassCard>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {exams.map((exam) => (
        <GlassCard
          key={exam.id}
          className="relative overflow-hidden border-l-[4px] border-l-emerald-500 hover:-translate-y-1 transition-all duration-300"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-50 dark:bg-blue-500/12">
              <BookOpen className="w-6 h-6 text-blue-500" />
            </div>
            <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-500">
              Đang mở
            </span>
          </div>
          <h3 className="text-[18px] font-bold text-[var(--text-primary)] mb-1 leading-tight">
            {exam.title}
          </h3>
          <p className="text-[14px] font-medium text-[var(--text-secondary)] mb-4">
            Mã đề: {exam.code}
          </p>

          <div className="flex flex-wrap gap-4 py-3.5 border-t border-b border-[var(--border-subtle)] mb-5">
            <div className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--text-secondary)]">
              <Clock className="w-[16px] h-[16px] text-blue-500" />{' '}
              {exam.durationMinutes} phút
            </div>
            <div className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--text-secondary)]">
              <HelpCircle className="w-[16px] h-[16px] text-amber-500" />{' '}
              {exam.totalQuestions} câu
            </div>
          </div>

          <div className="flex items-center justify-end">
            <Link href={`/exam/${exam.id}`}>
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105 transition-all gap-2 px-6">
                <Play className="w-4 h-4 fill-current" /> Vào thi ngay
              </Button>
            </Link>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
