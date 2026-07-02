import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

/**
 * Business test cho danh sách đề thi của sinh viên (ExamList).
 *  - Lấy đề từ getExamDefinitions, render mỗi đề một card với link /exam/[id].
 *  - Rỗng => báo "chưa có đề thi". Lỗi => báo lỗi.
 */
const getExamDefinitions = vi.fn();

vi.mock('@/services/api', () => ({
  getExamDefinitions: () => getExamDefinitions(),
}));

import { ExamList } from './ExamList';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ExamList (dashboard sinh viên)', () => {
  it('render card cho từng đề + link /exam/[id]', async () => {
    getExamDefinitions.mockResolvedValue([
      {
        id: '22222222-2222-4222-8222-222222222222',
        code: 'PH1020-CK',
        title: 'Lịch sử Đảng — Thi cuối kỳ',
        durationMinutes: 30,
        totalQuestions: 10,
        showResult: true,
      },
      {
        id: '33333333-3333-4333-8333-333333333333',
        code: 'EN1030-CK',
        title: 'Tiếng Anh cơ bản',
        durationMinutes: 30,
        totalQuestions: 15,
        showResult: true,
      },
    ]);

    render(<ExamList />);

    expect(
      await screen.findByText(/Lịch sử Đảng — Thi cuối kỳ/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Tiếng Anh cơ bản/i)).toBeInTheDocument();
    expect(screen.getByText(/10 câu/i)).toBeInTheDocument();

    const links = screen.getAllByRole('link', { name: /Vào thi ngay/i });
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute(
      'href',
      '/exam/22222222-2222-4222-8222-222222222222'
    );
  });

  it('danh sách rỗng => báo chưa có đề', async () => {
    getExamDefinitions.mockResolvedValue([]);
    render(<ExamList />);
    expect(
      await screen.findByText(/chưa có đề thi nào/i)
    ).toBeInTheDocument();
  });

  it('lỗi API => báo lỗi', async () => {
    getExamDefinitions.mockRejectedValue(new Error('boom'));
    render(<ExamList />);
    await waitFor(() =>
      expect(
        screen.getByText(/Không tải được danh sách đề thi/i)
      ).toBeInTheDocument()
    );
  });
});
