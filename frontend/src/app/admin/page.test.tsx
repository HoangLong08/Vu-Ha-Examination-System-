import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Business tests cho card "Cấu hình kỳ thi — CS101" (FR-L-003) ở trang admin.
 *
 * Hành vi mong đợi:
 *  - On mount: gọi getExamDefinition để lấy showResult hiện tại, hiển thị toggle
 *    đúng trạng thái.
 *  - Bật/tắt toggle: gọi setExamConfig với giá trị mới, cập nhật UI + báo "đã lưu".
 *  - Nút "Công bố kết quả": gọi publishResults, hiển thị "Đã công bố N kết quả".
 *  - Lỗi API: hiển thị thông báo lỗi (không crash).
 */

const getExamDefinition = vi.fn();
const setExamConfig = vi.fn();
const publishResults = vi.fn();
const getExamCoreMatrices = vi.fn();

vi.mock('@/services/api', () => ({
  getExamDefinition: (id: string) => getExamDefinition(id),
  setExamConfig: (id: string, config: unknown) => setExamConfig(id, config),
  publishResults: (id: string) => publishResults(id),
  getExamCoreMatrices: () => getExamCoreMatrices(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(''),
}));

import AdminPage from './page';

const DEMO_ID = '11111111-1111-4111-8111-111111111111';

beforeEach(() => {
  vi.clearAllMocks();
  getExamDefinition.mockResolvedValue({
    id: DEMO_ID,
    title: 'CS101',
    showResult: false,
    examCoreMatrixId: null,
  });
  setExamConfig.mockImplementation(
    async (_id: string, config: { showResult?: boolean; examCoreMatrixId?: string }) => ({
      id: DEMO_ID,
      title: 'CS101',
      showResult: config.showResult ?? false,
      examCoreMatrixId: config.examCoreMatrixId ?? null,
    })
  );
  publishResults.mockResolvedValue({ published: 12 });
  getExamCoreMatrices.mockResolvedValue({
    source: 'exam-core',
    items: [
      {
        id: 'mx00002-aaaa-4bbb-cccc-ddddeeee0002',
        code: 'MT-PH1020-CK',
        name: 'Ma trận Cuối kỳ — Lịch sử Đảng',
        bankId: 'qb000002',
        courseNameText: 'Lịch sử Đảng',
        examFormat: 'TRAC_NGHIEM',
        durationMinutes: 60,
        totalPoints: 10,
      },
    ],
  });
});

describe('Admin — ExamConfigCard (FR-L-003)', () => {
  it('tải showResult hiện tại on mount', async () => {
    render(<AdminPage />);
    await waitFor(() => expect(getExamDefinition).toHaveBeenCalledWith(DEMO_ID));
    expect(
      await screen.findByText(/Cấu hình kỳ thi — CS101/i)
    ).toBeInTheDocument();
  });

  it('bật toggle → gọi setExamConfig(true) và báo đã lưu', async () => {
    const user = userEvent.setup();
    render(<AdminPage />);

    const toggle = await screen.findByRole('switch', {
      name: /Cho phép sinh viên xem điểm/i,
    });
    expect(toggle).toHaveAttribute('aria-checked', 'false');

    await user.click(toggle);

    await waitFor(() =>
      expect(setExamConfig).toHaveBeenCalledWith(DEMO_ID, { showResult: true })
    );
    await waitFor(() =>
      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true')
    );
    expect(screen.getByText(/Đã lưu cấu hình/i)).toBeInTheDocument();
  });

  it('chọn ma trận → gọi setExamConfig với examCoreMatrixId và báo đã gắn', async () => {
    const user = userEvent.setup();
    render(<AdminPage />);

    const select = await screen.findByRole('combobox', {
      name: /Chọn ma trận đề/i,
    });
    await user.selectOptions(select, 'mx00002-aaaa-4bbb-cccc-ddddeeee0002');

    await waitFor(() =>
      expect(setExamConfig).toHaveBeenCalledWith(DEMO_ID, {
        examCoreMatrixId: 'mx00002-aaaa-4bbb-cccc-ddddeeee0002',
      })
    );
    expect(await screen.findByText(/Đã gắn ma trận đề/i)).toBeInTheDocument();
  });

  it('nút Công bố kết quả → gọi publishResults và hiện số đã công bố', async () => {
    const user = userEvent.setup();
    render(<AdminPage />);

    const publishBtn = await screen.findByRole('button', {
      name: /Công bố kết quả/i,
    });
    await user.click(publishBtn);

    await waitFor(() => expect(publishResults).toHaveBeenCalledWith(DEMO_ID));
    expect(await screen.findByText(/Đã công bố 12 kết quả/i)).toBeInTheDocument();
  });

  it('hiển thị lỗi khi tải cấu hình thất bại', async () => {
    getExamDefinition.mockRejectedValue(new Error('boom'));
    render(<AdminPage />);
    expect(
      await screen.findByText(/Không tải được cấu hình kỳ thi/i)
    ).toBeInTheDocument();
  });

  it('hiển thị lỗi khi công bố thất bại', async () => {
    publishResults.mockRejectedValue(new Error('boom'));
    const user = userEvent.setup();
    render(<AdminPage />);
    const publishBtn = await screen.findByRole('button', {
      name: /Công bố kết quả/i,
    });
    await user.click(publishBtn);
    expect(
      await screen.findByText(/Công bố kết quả thất bại/i)
    ).toBeInTheDocument();
  });
});
