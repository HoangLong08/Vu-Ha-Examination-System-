import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Quản lý Đề thi (admin) — danh sách thật + tạo đề mới.
 */
const getExamDefinitions = vi.fn();
const createExamDefinition = vi.fn();

vi.mock('@/services/api', () => ({
  getExamDefinitions: () => getExamDefinitions(),
  createExamDefinition: (p: unknown) => createExamDefinition(p),
}));

import { ExamManagement } from './ExamManagement';

beforeEach(() => {
  vi.clearAllMocks();
  getExamDefinitions.mockResolvedValue([
    {
      id: 'a',
      code: 'PH1020-CK',
      title: 'Lịch sử Đảng',
      durationMinutes: 30,
      totalQuestions: 10,
      showResult: true,
      examCoreMatrixId: 'mx-2',
    },
  ]);
});

describe('ExamManagement', () => {
  it('render danh sách đề thật + nhãn nguồn', async () => {
    render(<ExamManagement />);
    expect(await screen.findByText(/Lịch sử Đảng/)).toBeInTheDocument();
    expect(screen.getByText(/Ma trận đề/)).toBeInTheDocument();
  });

  it('tạo đề mới → gọi createExamDefinition rồi tải lại danh sách', async () => {
    createExamDefinition.mockResolvedValue({ id: 'b' });
    const user = userEvent.setup();
    render(<ExamManagement />);
    await screen.findByText(/Lịch sử Đảng/);

    // mở modal
    await user.click(screen.getByRole('button', { name: /Tạo Đề Thi/i }));
    await user.type(screen.getByLabelText('Mã đề'), 'CS999');
    await user.type(screen.getByLabelText('Tên đề'), 'Đề mới');
    await user.click(screen.getByRole('button', { name: /^Tạo đề$/i }));

    await waitFor(() =>
      expect(createExamDefinition).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'CS999', title: 'Đề mới' })
      )
    );
    // tải lại danh sách (getExamDefinitions gọi lần 2)
    await waitFor(() =>
      expect(getExamDefinitions.mock.calls.length).toBeGreaterThanOrEqual(2)
    );
  });

  it('thiếu mã/tên → báo lỗi, KHÔNG gọi API tạo', async () => {
    const user = userEvent.setup();
    render(<ExamManagement />);
    await screen.findByText(/Lịch sử Đảng/);
    await user.click(screen.getByRole('button', { name: /Tạo Đề Thi/i }));
    await user.click(screen.getByRole('button', { name: /^Tạo đề$/i }));
    expect(
      await screen.findByText(/Vui lòng nhập mã đề và tên đề/i)
    ).toBeInTheDocument();
    expect(createExamDefinition).not.toHaveBeenCalled();
  });
});
