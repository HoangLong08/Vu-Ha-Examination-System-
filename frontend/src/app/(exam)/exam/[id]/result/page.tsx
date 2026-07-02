'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { RichText } from '@/components/ui/RichText';
import {
  CheckCircle2, XCircle, MinusCircle,
  ListChecks, Check, X, Minus,
  Clock, AlertCircle, PartyPopper,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { useAuth } from '@/context/AuthContext';
import { GlassCard } from '@/components/ui/GlassCard';
import {
  getAttemptReview,
  getExamAttempt,
  type ReviewResponse,
} from '@/services/api';

type LoadState =
  | { phase: 'loading' }
  | { phase: 'pending' } // 403 — chưa công bố
  | { phase: 'error'; message: string }
  | { phase: 'ready'; data: ReviewResponse };

type Filter = 'all' | 'correct' | 'wrong' | 'skipped';

/** Animate a number from 0 up to `target` (one decimal place). */
function useCountUp(target: number, active: boolean) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    let current = 0;
    const step = Math.max(target / 85, 0.05);
    const interval = setInterval(() => {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(interval);
      }
      setValue(Number(current.toFixed(1)));
    }, 30);
    return () => clearInterval(interval);
  }, [target, active]);
  return value;
}

function gradeLabel(score: number): string {
  if (score >= 8.5) return 'Giỏi';
  if (score >= 7) return 'Khá';
  if (score >= 5) return 'Trung bình';
  return 'Cần cố gắng';
}

export default function ExamResultPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { logout } = useAuth();
  // Thi xong -> ĐÓNG: đăng xuất sinh viên + về trang đăng nhập để SV khác vào thi.
  const handleClose = () => {
    logout();
    router.push('/login');
  };
  // Lấy GIÁ TRỊ (string) thay vì object searchParams để dep ổn định — tránh
  // vòng lặp render vô hạn (object đổi tham chiếu mỗi render → OOM trong test).
  const attemptParam = searchParams.get('attempt');
  const examId = Array.isArray(params.id) ? params.id[0] : (params.id ?? '');

  const [load, setLoad] = useState<LoadState>({ phase: 'loading' });
  const [filter, setFilter] = useState<Filter>('all');

  const fetchReview = useCallback(async () => {
    setLoad({ phase: 'loading' });
    try {
      let attemptId = attemptParam;
      if (!attemptId && examId) {
        const attempt = await getExamAttempt(examId);
        attemptId = attempt?.id ?? null;
      }
      if (!attemptId) {
        setLoad({ phase: 'error', message: 'Không tìm thấy lượt làm bài.' });
        return;
      }
      const data = await getAttemptReview(attemptId);
      setLoad({ phase: 'ready', data });
    } catch (err) {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      if (status === 403) {
        setLoad({ phase: 'pending' });
      } else if (status === 404) {
        setLoad({ phase: 'error', message: 'Chưa có kết quả cho bài thi này.' });
      } else {
        console.error('Tải kết quả thất bại:', err);
        setLoad({
          phase: 'error',
          message: 'Không thể tải kết quả. Vui lòng thử lại sau.',
        });
      }
    }
  }, [examId, attemptParam]);

  useEffect(() => {
    void fetchReview();
  }, [fetchReview]);

  // ── Score circle ───────────────────────────────────────────────────────────
  const circumference = 2 * Math.PI * 80;
  const targetScore =
    load.phase === 'ready' ? (load.data.result?.score ?? 0) : 0;
  const score = useCountUp(targetScore, load.phase === 'ready');
  const strokeDashoffset = circumference * (1 - score / 10);

  // ── Header (shared) ──────────────────────────────────────────────────────────
  const header = (
    <header className="glass-header sticky top-0 z-50 flex items-center justify-between px-8 py-4">
      <div className="flex items-center gap-3.5">
        <BrandLogo size={38} bare />
        <div className="min-w-0">
          <h2 className="text-[15px] font-bold text-[var(--text-primary)] leading-tight truncate">DAU Exam</h2>
          <p className="text-[11px] text-[var(--text-secondary)] font-medium tracking-wide uppercase truncate">Hệ thống trắc nghiệm</p>
        </div>
      </div>
      <div className="flex gap-2.5">
        <ThemeToggle />
      </div>
    </header>
  );

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (load.phase === 'loading') {
    return (
      <div className="flex flex-col min-h-screen relative z-[1]">
        {header}
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[var(--text-secondary)] font-medium">Đang tải kết quả…</p>
        </div>
      </div>
    );
  }

  // ── 403: kết quả chưa công bố ────────────────────────────────────────────────
  if (load.phase === 'pending') {
    return (
      <div className="flex flex-col min-h-screen relative z-[1]">
        {header}
        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <GlassCard className="max-w-[520px] w-full p-10 text-center">
            <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-blue-500/12 flex items-center justify-center animate-[pop_0.6s_ease_0.1s_both]">
              <Clock className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-[24px] font-bold text-[var(--text-primary)] mb-2.5">
              Bài thi đã nộp thành công
            </h1>
            <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed mb-7">
              Kết quả sẽ được công bố sau. Vui lòng quay lại sau khi giảng viên
              công bố điểm.
            </p>
            <button type="button" onClick={handleClose} className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-[14px] text-[15px] font-bold text-white bg-gradient-to-br from-blue-600 to-blue-700 shadow-[0_4px_16px_rgba(37,99,235,0.3)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(37,99,235,0.4)] transition-all"><X className="w-5 h-5" /> Đóng</button>
          </GlassCard>
        </div>
      </div>
    );
  }

  // ── Error (404 / khác) ───────────────────────────────────────────────────────
  if (load.phase === 'error') {
    return (
      <div className="flex flex-col min-h-screen relative z-[1]">
        {header}
        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <GlassCard className="max-w-[520px] w-full p-10 text-center">
            <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-amber-500/12 flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-amber-600" />
            </div>
            <h1 className="text-[22px] font-bold text-[var(--text-primary)] mb-2.5">
              Không có kết quả
            </h1>
            <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed mb-7">
              {load.message}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button
                onClick={() => void fetchReview()}
                className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-[14px] text-[15px] font-bold text-[var(--text-primary)] bg-[var(--bg-glass)] border border-[var(--border-glass)] hover:bg-[var(--bg-glass-heavy)] transition-all"
              >
                Thử lại
              </button>
              <button type="button" onClick={handleClose} className="inline-flex items-center justify-center gap-2.5 px-7 py-3 rounded-[14px] text-[15px] font-bold text-white bg-gradient-to-br from-blue-600 to-blue-700 shadow-[0_4px_16px_rgba(37,99,235,0.3)] hover:-translate-y-0.5 transition-all"><X className="w-5 h-5" /> Đóng</button>
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  // ── Ready nhưng đề KHÔNG cho xem điểm (FR-L-003) ─────────────────────────────
  // showResult === false hoặc result === null → chỉ báo hoàn thành, không lộ điểm.
  if (load.data.showResult === false || load.data.result === null) {
    const { summary } = load.data;
    return (
      <div className="flex flex-col min-h-screen relative z-[1]">
        {header}
        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <GlassCard className="max-w-[520px] w-full p-10 text-center animate-[page-enter_0.5s_ease]">
            <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-emerald-500/12 flex items-center justify-center animate-[pop_0.6s_ease_0.1s_both]">
              <PartyPopper className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h1 className="text-[24px] font-bold text-[var(--text-primary)] mb-2.5">
              Chúc mừng! Bạn đã hoàn thành bài thi
            </h1>
            <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed mb-2">
              Bài thi của bạn đã được ghi nhận thành công.
            </p>
            <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed mb-7">
              Bạn đã làm{' '}
              <span className="font-bold text-[var(--text-primary)]">
                {summary.answered}/{summary.total}
              </span>{' '}
              câu. Đề thi này không hiển thị điểm chi tiết.
            </p>
            <button type="button" onClick={handleClose} className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-[14px] text-[15px] font-bold text-white bg-gradient-to-br from-blue-600 to-blue-700 shadow-[0_4px_16px_rgba(37,99,235,0.3)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(37,99,235,0.4)] transition-all"><X className="w-5 h-5" /> Đóng</button>
          </GlassCard>
        </div>
      </div>
    );
  }

  // ── Ready (200): dữ liệu thật + cho xem điểm ─────────────────────────────────
  const { result, review, summary } = load.data;
  const correct = result.correctAnswers;
  const wrong = result.wrongAnswers;
  const skipped = summary.skipped;
  const total = result.totalQuestions;
  const percent = total > 0 ? Math.round((correct / total) * 100) : 0;

  const filteredReviews = review.filter(
    (r) => filter === 'all' || r.status === filter
  );

  const filterDefs: { id: Filter; label: string; icon: typeof ListChecks }[] = [
    { id: 'all', label: `Tất cả (${total})`, icon: ListChecks },
    { id: 'correct', label: `Đúng (${correct})`, icon: Check },
    { id: 'wrong', label: `Sai (${wrong})`, icon: X },
    { id: 'skipped', label: `Bỏ qua (${skipped})`, icon: Minus },
  ];

  return (
    <div className="flex flex-col min-h-screen relative z-[1]">
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
      </svg>

      {header}

      <div className="max-w-[960px] mx-auto w-full px-6 py-10 pb-16 animate-[page-enter_0.5s_ease]">
        <div className="text-center mb-9">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-emerald-500/12 flex items-center justify-center animate-[pop_0.6s_ease_0.2s_both]">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-[28px] font-bold mb-1.5 bg-gradient-to-br from-emerald-600 to-emerald-400 bg-clip-text text-transparent">
            Hoàn thành bài thi!
          </h1>
          <p className="text-[15px] text-[var(--text-secondary)]">
            Bài thi của bạn đã được chấm tự động
          </p>
        </div>

        <GlassCard className="p-10 mb-7">
          <div className="flex flex-col md:flex-row items-center gap-12 mb-8">
            <div className="w-[180px] h-[180px] shrink-0 relative">
              <svg viewBox="0 0 180 180" className="-rotate-90 w-full h-full">
                <circle cx="90" cy="90" r="80" fill="none" stroke="var(--border-subtle)" strokeWidth="8" />
                <circle
                  cx="90" cy="90" r="80"
                  fill="none"
                  stroke="url(#scoreGradient)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-[42px] font-bold font-mono bg-gradient-to-br from-emerald-600 to-emerald-400 bg-clip-text text-transparent leading-none">
                  {score.toFixed(1)}
                </div>
                <div className="text-[16px] font-medium text-[var(--text-muted)] mt-0.5">/ 10</div>
                <div className="text-[13px] font-bold mt-1.5 px-3 py-1 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-500">
                  {gradeLabel(result.score)}
                </div>
              </div>
            </div>

            <div className="flex-1 w-full">
              <h3 className="text-[20px] font-bold text-[var(--text-primary)] mb-5">Chi tiết kết quả</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="bg-[var(--bg-glass)] border border-[var(--border-subtle)] rounded-[14px] p-4.5 transition-all hover:-translate-y-0.5 hover:shadow-lg">
                  <div className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center mb-2.5 bg-emerald-500/12 text-emerald-600">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="text-[22px] font-bold text-[var(--text-primary)]">{correct}</div>
                  <div className="text-[12px] font-medium text-[var(--text-secondary)] mt-0.5">Câu đúng</div>
                </div>
                <div className="bg-[var(--bg-glass)] border border-[var(--border-subtle)] rounded-[14px] p-4.5 transition-all hover:-translate-y-0.5 hover:shadow-lg">
                  <div className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center mb-2.5 bg-rose-500/12 text-rose-600">
                    <XCircle className="w-5 h-5" />
                  </div>
                  <div className="text-[22px] font-bold text-[var(--text-primary)]">{wrong}</div>
                  <div className="text-[12px] font-medium text-[var(--text-secondary)] mt-0.5">Câu sai</div>
                </div>
                <div className="bg-[var(--bg-glass)] border border-[var(--border-subtle)] rounded-[14px] p-4.5 transition-all hover:-translate-y-0.5 hover:shadow-lg">
                  <div className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center mb-2.5 bg-amber-500/12 text-amber-600">
                    <MinusCircle className="w-5 h-5" />
                  </div>
                  <div className="text-[22px] font-bold text-[var(--text-primary)]">{skipped}</div>
                  <div className="text-[12px] font-medium text-[var(--text-secondary)] mt-0.5">Bỏ qua</div>
                </div>
                <div className="bg-[var(--bg-glass)] border border-[var(--border-subtle)] rounded-[14px] p-4.5 transition-all hover:-translate-y-0.5 hover:shadow-lg">
                  <div className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center mb-2.5 bg-blue-500/12 text-blue-600">
                    <ListChecks className="w-5 h-5" />
                  </div>
                  <div className="text-[22px] font-bold text-[var(--text-primary)]">{total}</div>
                  <div className="text-[12px] font-medium text-[var(--text-secondary)] mt-0.5">Tổng số câu</div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-7 border-t border-[var(--border-subtle)]">
            <div className="flex justify-between mb-2.5 text-[13px] font-semibold text-[var(--text-secondary)]">
              <span>Tỷ lệ chính xác</span>
              <span>{correct}/{total} câu đúng ({percent}%)</span>
            </div>
            <div className="h-2.5 rounded-full bg-[var(--bg-glass)] border border-[var(--border-subtle)] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-1000 ease-out"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        </GlassCard>

        <div className="mt-7">
          <div className="text-[18px] font-bold text-[var(--text-primary)] mb-4.5 flex items-center gap-2.5">
            <ListChecks className="w-[22px] h-[22px] text-blue-600 dark:text-blue-400" />
            Xem lại câu hỏi
          </div>

          <div className="flex flex-wrap gap-2 mb-4.5">
            {filterDefs.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-4.5 py-2 rounded-[10px] text-[13px] font-semibold transition-all border inline-flex items-center gap-1.5
                  ${filter === f.id
                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white border-transparent'
                    : 'bg-[var(--bg-glass)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-glass-heavy)] hover:text-[var(--text-primary)]'
                  }
                `}
              >
                <f.icon className="w-3.5 h-3.5" /> {f.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2.5">
            {filteredReviews.length === 0 && (
              <GlassCard className="px-5 py-8 text-center text-[14px] text-[var(--text-secondary)]">
                Không có câu hỏi nào trong mục này.
              </GlassCard>
            )}
            {filteredReviews.map((r) => (
              <GlassCard key={r.questionId} className="flex items-start gap-4 px-5 py-4.5 transition-all hover:translate-x-1">
                <div className={`w-[42px] h-[42px] rounded-xl flex items-center justify-center shrink-0
                  ${r.status === 'correct' ? 'bg-emerald-500/12 text-emerald-600' : ''}
                  ${r.status === 'wrong' ? 'bg-rose-500/12 text-rose-600' : ''}
                  ${r.status === 'skipped' ? 'bg-amber-500/12 text-amber-600' : ''}
                `}>
                  {r.status === 'correct' && <Check className="w-[22px] h-[22px]" />}
                  {r.status === 'wrong' && <X className="w-[22px] h-[22px]" />}
                  {r.status === 'skipped' && <Minus className="w-[22px] h-[22px]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold text-[var(--text-secondary)] mb-1">
                    Câu {r.order}
                  </div>
                  <RichText
                    text={r.content}
                    className="block text-[14px] font-semibold text-[var(--text-primary)] mb-2 leading-relaxed [&_*]:inline"
                  />
                  <div className="flex flex-col gap-1 text-[13px]">
                    <span className="text-[var(--text-secondary)]">
                      Bạn chọn:{' '}
                      <span className={`font-semibold ${r.status === 'correct' ? 'text-emerald-600' : r.status === 'wrong' ? 'text-rose-600' : 'text-amber-600'}`}>
                        {r.yourAnswer ?? '—'}
                      </span>
                    </span>
                    <span className="text-[var(--text-secondary)]">
                      Đáp án đúng:{' '}
                      <span className="font-semibold text-emerald-600">{r.correctAnswer}</span>
                    </span>
                  </div>
                </div>
                <div className="shrink-0">
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md inline-flex items-center gap-1
                    ${r.status === 'correct' ? 'bg-emerald-500/12 text-emerald-600' : ''}
                    ${r.status === 'wrong' ? 'bg-rose-500/12 text-rose-600' : ''}
                    ${r.status === 'skipped' ? 'bg-amber-500/12 text-amber-600' : ''}
                  `}>
                    {r.status === 'correct' && <><Check className="w-3 h-3" /> Đúng</>}
                    {r.status === 'wrong' && <><X className="w-3 h-3" /> Sai</>}
                    {r.status === 'skipped' && <><Minus className="w-3 h-3" /> Bỏ qua</>}
                  </span>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-3.5 mt-9">
          <button type="button" onClick={handleClose} className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-[14px] text-[15px] font-bold text-white bg-gradient-to-br from-blue-600 to-blue-700 shadow-[0_4px_16px_rgba(37,99,235,0.3)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(37,99,235,0.4)] transition-all"><X className="w-5 h-5" /> Đóng</button>
        </div>
      </div>
    </div>
  );
}
