import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

import type { ReviewResponse } from '@/services/api';

/**
 * Business tests cho trang Kết quả (FR-L-003 — Hiện/Ẩn kết quả).
 *
 * Hành vi mong đợi theo cờ `showResult` từ backend:
 *  - showResult === false (hoặc result === null): chỉ hiển thị màn "Chúc mừng!
 *    Bạn đã hoàn thành bài thi" + số câu đã làm; KHÔNG lộ điểm / đáp án.
 *  - showResult === true: hiển thị điểm, thống kê đúng/sai và review từng câu.
 *  - 403 (chưa công bố) và 404 (chưa có kết quả) vẫn giữ các màn cũ.
 */

const getAttemptReview = vi.fn<(id: string) => Promise<ReviewResponse>>();
const getExamAttempt = vi.fn(async () => ({ id: 'attempt-1', status: 'SUBMITTED' }));

vi.mock('@/services/api', () => ({
  getAttemptReview: (id: string) => getAttemptReview(id),
  getExamAttempt: () => getExamAttempt(),
}));

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'exam-1' }),
  useSearchParams: () => new URLSearchParams('attempt=attempt-1'),
  useRouter: () => ({ push: vi.fn() }),
}));

// Trang kết quả dùng useAuth() để "Đóng" = đăng xuất — mock để không cần Provider.
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ logout: vi.fn() }),
}));

// ThemeToggle dùng localStorage/matchMedia (browser-only) — không thuộc phạm vi
// test này, mock để tránh lệ thuộc môi trường.
vi.mock('@/components/ui/ThemeToggle', () => ({
  ThemeToggle: () => null,
}));

import ExamResultPage from './page';

const baseSummary = { total: 5, answered: 4, skipped: 1 };

beforeEach(() => {
  vi.clearAllMocks();
  getExamAttempt.mockResolvedValue({ id: 'attempt-1', status: 'SUBMITTED' });
});

describe('ExamResultPage — showResult flag', () => {
  it('hiện màn chúc mừng (không lộ điểm) khi showResult === false', async () => {
    getAttemptReview.mockResolvedValue({
      showResult: false,
      result: null,
      review: [],
      summary: baseSummary,
    });

    render(<ExamResultPage />);

    await waitFor(() =>
      expect(
        screen.getByText(/Chúc mừng! Bạn đã hoàn thành bài thi/i)
      ).toBeInTheDocument()
    );
    // số câu đã làm hiển thị, điểm/đáp án KHÔNG hiển thị
    expect(screen.getByText(/4\/5/)).toBeInTheDocument();
    expect(screen.queryByText(/Đáp án đúng/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Chi tiết kết quả/i)).not.toBeInTheDocument();
  });

  it('hiện màn chúc mừng khi result === null dù showResult không gửi', async () => {
    getAttemptReview.mockResolvedValue({
      result: null,
      review: [],
      summary: baseSummary,
    });

    render(<ExamResultPage />);

    await waitFor(() =>
      expect(
        screen.getByText(/Chúc mừng! Bạn đã hoàn thành bài thi/i)
      ).toBeInTheDocument()
    );
    expect(screen.queryByText(/\/ 10/)).not.toBeInTheDocument();
  });

  it('hiện điểm + review khi showResult === true', async () => {
    getAttemptReview.mockResolvedValue({
      showResult: true,
      result: {
        score: 8,
        correctAnswers: 4,
        wrongAnswers: 1,
        totalQuestions: 5,
        published: true,
      },
      review: [
        {
          questionId: 'q1',
          order: 1,
          content: 'Câu hỏi 1',
          type: 'SINGLE_CHOICE',
          yourAnswer: 'A',
          correctAnswer: 'A',
          status: 'correct',
        },
      ],
      summary: baseSummary,
    });

    render(<ExamResultPage />);

    await waitFor(() =>
      expect(screen.getByText(/Chi tiết kết quả/i)).toBeInTheDocument()
    );
    expect(screen.getByText(/Đáp án đúng/i)).toBeInTheDocument();
    expect(
      screen.queryByText(/Chúc mừng! Bạn đã hoàn thành bài thi/i)
    ).not.toBeInTheDocument();
  });
});
