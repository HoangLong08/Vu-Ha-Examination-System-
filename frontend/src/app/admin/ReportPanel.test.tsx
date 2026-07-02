import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * EPIC-20 — Báo cáo & thống kê (ReportPanel).
 *  - Tải tổng quan, render bảng theo đề.
 *  - Bấm "Phổ điểm" → tải chi tiết, hiển thị phổ điểm + chỉ số.
 *  - Rỗng => báo chưa có bài thi.
 */
const getReportOverview = vi.fn();
const getExamReport = vi.fn();

vi.mock('@/services/api', () => ({
  getReportOverview: () => getReportOverview(),
  getExamReport: (id: string) => getExamReport(id),
}));

import { ReportPanel } from './ReportPanel';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ReportPanel (EPIC-20)', () => {
  it('render bảng tổng quan + phổ điểm khi bấm', async () => {
    getReportOverview.mockResolvedValue([
      {
        examDefinitionId: 'a',
        code: 'PH1020',
        title: 'Lịch sử Đảng',
        count: 12,
        average: 6.5,
        passRate: 75,
      },
    ]);
    getExamReport.mockResolvedValue({
      examDefinitionId: 'a',
      code: 'PH1020',
      title: 'Lịch sử Đảng',
      count: 12,
      average: 6.5,
      max: 10,
      min: 2,
      passCount: 9,
      passRate: 75,
      distribution: [
        { label: '0–2', count: 0 },
        { label: '2–4', count: 2 },
        { label: '4–6', count: 3 },
        { label: '6–8', count: 4 },
        { label: '8–10', count: 3 },
      ],
    });

    const user = userEvent.setup();
    render(<ReportPanel />);

    expect(await screen.findByText(/Lịch sử Đảng/i)).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Phổ điểm/i }));

    await waitFor(() => expect(getExamReport).toHaveBeenCalledWith('a'));
    expect(
      await screen.findByText(/Phổ điểm — Lịch sử Đảng/i)
    ).toBeInTheDocument();
  });

  it('rỗng => báo chưa có bài thi', async () => {
    getReportOverview.mockResolvedValue([]);
    render(<ReportPanel />);
    expect(
      await screen.findByText(/Chưa có bài thi nào được nộp/i)
    ).toBeInTheDocument();
  });

  it('lỗi API => báo lỗi', async () => {
    getReportOverview.mockRejectedValue(new Error('boom'));
    render(<ReportPanel />);
    expect(
      await screen.findByText(/Không tải được báo cáo/i)
    ).toBeInTheDocument();
  });
});
