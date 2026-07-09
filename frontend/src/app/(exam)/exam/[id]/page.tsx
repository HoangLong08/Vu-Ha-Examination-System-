'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, Bookmark, WifiOff, Lock } from 'lucide-react';
import { ExamHeader } from '@/components/exam/ExamHeader';
import { QuestionCard } from '@/components/exam/QuestionCard';
import { QuestionNav } from '@/components/exam/QuestionNav';
import { StudentExamSidebar } from '@/components/exam/StudentExamSidebar';
import { SubmitConfirmModal } from '@/components/exam/SubmitConfirmModal';
import { Modal } from '@/components/ui/Modal';
import { useExamSecurity } from '@/hooks/useExamSecurity';
import { useExamSession } from '@/hooks/useExamSession';
import { getExamDefinitions, type ExamDefinitionListItem } from '@/services/api';

/**
 * Trang thi: vào THẲNG phần làm bài (đã bỏ màn kiểm tra thiết bị — không cần
 * thiết với đề trắc nghiệm). `useExamSession` bắt đầu/khôi phục lượt thi.
 */
export default function ExamPlayerPage() {
  const params = useParams();
  const examId = Array.isArray(params.id) ? params.id[0] : (params.id ?? '');

  return <ExamSessionView examId={examId} />;
}

/**
 * Phần làm bài thực sự. Tách thành component con để hook `useExamSession`
 * chỉ chạy SAU khi sinh viên đã qua kiểm tra thiết bị và bấm vào thi.
 */
function ExamSessionView({ examId }: { examId: string }) {
  const router = useRouter();

  const {
    attemptId,
    answers,
    questions,
    remainingSeconds,
    isOnline,
    selectAnswer,
    submit,
    loading,
    error,
    errorCode,
  } = useExamSession(examId);

  const totalQuestions = questions.length;

  const [currentIdx, setCurrentIdx] = useState(0);
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  // Tên đề THẬT (tiêu đề/mã/thời lượng) để hiển thị ở khu làm bài + sidebar.
  const [examMeta, setExamMeta] = useState<ExamDefinitionListItem | null>(null);
  useEffect(() => {
    let active = true;
    getExamDefinitions()
      .then((list) => {
        if (active) setExamMeta(list.find((e) => e.id === examId) ?? null);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [examId]);

  // Security hooks — use the real attemptId once available.
  useExamSecurity(attemptId ?? '', !!attemptId);

  // Keep the active index inside the loaded question range.
  const safeIdx =
    totalQuestions > 0 ? Math.min(currentIdx, totalQuestions - 1) : 0;
  const activeQuestion = questions[safeIdx];

  const handleSelectAnswer = (key: string) => {
    const q = activeQuestion;
    if (!q) return;
    const currentAnswers = answers[q.id] || [];
    let newValue: string[];
    if (q.type === 'SINGLE_CHOICE' || q.type === 'TRUE_FALSE') {
      newValue = [key];
    } else if (currentAnswers.includes(key)) {
      newValue = currentAnswers.filter(k => k !== key);
    } else {
      newValue = [...currentAnswers, key];
    }
    selectAnswer(q.id, newValue);
  };

  const toggleFlag = () => {
    setFlagged(prev => {
      const newFlagged = new Set(prev);
      if (newFlagged.has(safeIdx)) {
        newFlagged.delete(safeIdx);
      } else {
        newFlagged.add(safeIdx);
      }
      return newFlagged;
    });
  };

  const handleNavigate = (idx: number) => {
    setCurrentIdx(Math.max(0, Math.min(idx, totalQuestions - 1)));
  };

  const handleOpenSubmitModal = () => {
    setIsSubmitModalOpen(true);
  };

  const handleConfirmSubmit = async () => {
    setIsSubmitModalOpen(false);
    try {
      await submit();
    } catch (err) {
      console.error('Nộp bài thất bại:', err);
    }
    const resultUrl = attemptId
      ? `/exam/${examId}/result?attempt=${attemptId}`
      : `/exam/${examId}/result`;
    router.push(resultUrl);
  };

  // Calculate answered questions based on state (index within loaded questions).
  const answeredSet = new Set<number>();
  Object.entries(answers).forEach(([qId, ans]) => {
    if (ans.length > 0) {
      const idx = questions.findIndex(q => q.id === qId);
      if (idx !== -1) answeredSet.add(idx);
    }
  });

  // Hết số lần thi cho phép: KHÔNG chuyển vào màn làm bài, chỉ hiển thị dialog
  // thân thiện rồi đưa sinh viên quay lại danh sách đề (không load recovery/câu hỏi).
  if (errorCode === 'EXAM_ATTEMPT_LIMIT_REACHED') {
    return (
      <Modal isOpen onClose={() => router.push('/')} title="Không thể vào thi">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10">
            <Lock className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-[var(--text-primary)] font-medium">
            Bạn đã hoàn thành bài thi này. Bạn không thể vào thi lại vì đã hết số lần thi được phép.
          </p>
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-2 px-6 py-3 font-semibold rounded-[14px] bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-md shadow-brand-500/25 hover:shadow-lg hover:shadow-brand-500/40"
          >
            Quay lại trang chủ
          </button>
        </div>
      </Modal>
    );
  }

  if (loading || (totalQuestions === 0 && !error)) {
    return (
      <div className="flex flex-1 items-center justify-center bg-[var(--bg-primary)] relative z-[1]">
        <p className="text-[var(--text-secondary)] font-medium">
          Đang tải đề thi…
        </p>
      </div>
    );
  }

  if (error || !activeQuestion) {
    return (
      <div className="flex flex-1 items-center justify-center bg-[var(--bg-primary)] relative z-[1]">
        <p className="text-red-600 font-medium max-w-md text-center px-6">
          {error ?? 'Không thể tải đề thi. Vui lòng thử lại.'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 relative z-[1]">
      <ExamHeader
        currentQuestion={safeIdx + 1}
        totalQuestions={totalQuestions}
        timerSeconds={remainingSeconds}
        onTimeUp={handleConfirmSubmit}
      />

      {!isOnline && (
        <div className="flex items-center justify-center gap-2 py-1.5 bg-amber-500/10 text-amber-600 text-[13px] font-semibold border-b border-amber-500/20">
          <WifiOff className="w-4 h-4" />
          Offline — đã lưu cục bộ
        </div>
      )}

      <div className="flex flex-1 relative bg-[var(--bg-primary)]">
        <StudentExamSidebar
          examInfo={{
            subjectCode: examMeta?.code ?? '—',
            duration: examMeta?.durationMinutes ?? 60,
            totalQuestions: totalQuestions,
            maxScore: 10
          }}
          answeredCount={answeredSet.size}
        />

        <main className="flex-1 p-8 flex flex-col items-center">
          {/* Tên đề thi (thật) — chuyển từ header xuống đây */}
          <div className="w-full max-w-[800px] mb-5">
            <h1 className="text-xl font-bold text-[var(--text-primary)] leading-tight">
              {examMeta?.title ?? 'Đề thi'}
            </h1>
            {examMeta && (
              <p className="text-[13px] text-[var(--text-secondary)] font-medium mt-1">
                Mã đề: {examMeta.code} · {totalQuestions} câu · {examMeta.durationMinutes} phút
              </p>
            )}
          </div>

          <QuestionCard
            questionNumber={safeIdx + 1}
            totalQuestions={totalQuestions}
            type={activeQuestion.type}
            difficulty={activeQuestion.difficulty ?? 'DE'}
            content={activeQuestion.content}
            options={activeQuestion.options}
            selectedAnswers={answers[activeQuestion.id] || []}
            onSelectAnswer={handleSelectAnswer}
            onTextAnswer={(t) => {
              // Câu GÕ TEXT (điền khuyết/giá trị, tự luận) -> debounce gửi server;
              // còn đối sánh/sắp xếp/phân loại + hotspot dùng onTextAnswer nhưng là
              // thao tác CHỌN/CLICK rời rạc -> gửi ngay.
              const isTyping =
                activeQuestion.type === 'FILL_BLANK' ||
                activeQuestion.type === 'NUMERIC' ||
                activeQuestion.type === 'ESSAY';
              selectAnswer(activeQuestion.id, t.trim() ? [t] : [], isTyping);
            }}
            items={activeQuestion.items}
            targets={activeQuestion.targets}
            mediaUrl={activeQuestion.mediaUrl}
            mediaType={activeQuestion.mediaType}
          />

          <div className="flex items-center justify-between mt-8 w-full max-w-[800px]">
            <button
              onClick={() => handleNavigate(safeIdx - 1)}
              disabled={safeIdx === 0}
              className="inline-flex items-center gap-2 px-6 py-3 font-semibold rounded-[14px] border border-transparent transition-all bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-md shadow-brand-500/25 hover:shadow-lg hover:shadow-brand-500/40 disabled:cursor-not-allowed disabled:bg-none disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:shadow-none dark:disabled:bg-white/[0.04] dark:disabled:border-white/10 dark:disabled:text-slate-600"
            >
              <ChevronLeft className="w-[18px] h-[18px]" /> Câu trước
            </button>
            <button
              onClick={toggleFlag}
              className={`inline-flex items-center gap-2 px-6 py-3 font-semibold rounded-[14px] border transition-all
                ${flagged.has(safeIdx)
                  ? 'border-amber-500 text-amber-700 bg-amber-100 dark:border-amber-500/60 dark:text-amber-300 dark:bg-amber-500/20'
                  : 'bg-amber-50 border-amber-400/50 text-amber-700 hover:bg-amber-100 hover:border-amber-500 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-300 dark:hover:bg-amber-500/20'}
              `}
            >
              <Bookmark className="w-[18px] h-[18px]" /> Đánh dấu
            </button>
            <button
              onClick={() => handleNavigate(safeIdx + 1)}
              disabled={safeIdx === totalQuestions - 1}
              className="inline-flex items-center gap-2 px-6 py-3 font-semibold rounded-[14px] border border-transparent transition-all bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-md shadow-brand-500/25 hover:shadow-lg hover:shadow-brand-500/40 disabled:cursor-not-allowed disabled:bg-none disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:shadow-none dark:disabled:bg-white/[0.04] dark:disabled:border-white/10 dark:disabled:text-slate-600"
            >
              Câu sau <ChevronRight className="w-[18px] h-[18px]" />
            </button>
          </div>
        </main>

        <QuestionNav
          totalQuestions={totalQuestions}
          currentQuestion={safeIdx}
          answeredQuestions={answeredSet}
          flaggedQuestions={flagged}
          onNavigate={handleNavigate}
          onSubmit={handleOpenSubmitModal}
        />
      </div>

      <SubmitConfirmModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onConfirm={handleConfirmSubmit}
        answeredCount={answeredSet.size}
        totalQuestions={totalQuestions}
      />
    </div>
  );
}
