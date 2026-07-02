import { describe, it, expect, vi } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuestionCard } from './QuestionCard';

/**
 * Business tests for the exam answering component (QuestionCard).
 *
 * Behavior of the real component (read from QuestionCard.tsx):
 *  - Each option is rendered as a <button>; clicking it calls onSelectAnswer(option.key).
 *  - `isSingle = type === 'SINGLE_CHOICE' || type === 'TRUE_FALSE'` controls the
 *    indicator shape (round vs square) but the component does NOT enforce
 *    single-selection itself — selection state is driven entirely by the
 *    `selectedAnswers` prop supplied by the parent.
 *  - The component renders a type label ('Một đáp án' / 'Nhiều đáp án' / 'Đúng / Sai')
 *    and a difficulty label.
 *  - An optional `mediaUrl` prop renders an <img> for image-based questions.
 *  - `content` is sanitized (DOMPurify) before being injected as HTML.
 */

const baseOptions = [
  { key: 'A', value: 'Đáp án A' },
  { key: 'B', value: 'Đáp án B' },
  { key: 'C', value: 'Đáp án C' },
  { key: 'D', value: 'Đáp án D' },
];

function renderCard(overrides: Partial<React.ComponentProps<typeof QuestionCard>> = {}) {
  const onSelectAnswer = vi.fn();
  const props = {
    questionNumber: 1,
    totalQuestions: 10,
    type: 'SINGLE_CHOICE' as const,
    difficulty: 'DE',
    content: 'Thủ đô của Việt Nam là gì?',
    options: baseOptions,
    selectedAnswers: [] as string[],
    onSelectAnswer,
    ...overrides,
  };
  const { container } = render(<QuestionCard {...props} />);
  return { onSelectAnswer, props, container };
}

describe('QuestionCard - SINGLE_CHOICE', () => {
  it('renders all options', () => {
    renderCard({ type: 'SINGLE_CHOICE' });
    expect(screen.getByText('Đáp án A')).toBeInTheDocument();
    expect(screen.getByText('Đáp án B')).toBeInTheDocument();
    expect(screen.getByText('Đáp án C')).toBeInTheDocument();
    expect(screen.getByText('Đáp án D')).toBeInTheDocument();
    // One button per option.
    expect(screen.getAllByRole('button')).toHaveLength(baseOptions.length);
  });

  it('calls onSelectAnswer with the option key when an option is clicked', async () => {
    const user = userEvent.setup();
    const { onSelectAnswer } = renderCard({ type: 'SINGLE_CHOICE' });

    await user.click(screen.getByRole('button', { name: /Đáp án B/ }));

    expect(onSelectAnswer).toHaveBeenCalledTimes(1);
    expect(onSelectAnswer).toHaveBeenCalledWith('B');
  });

  it('shows the "Một đáp án" (single answer) type label', () => {
    renderCard({ type: 'SINGLE_CHOICE' });
    expect(screen.getByText('Một đáp án')).toBeInTheDocument();
  });

  it('renders round (radio-style) indicators for single-choice questions', () => {
    renderCard({ type: 'SINGLE_CHOICE' });
    // The indicator wrapper uses `rounded-full` for single-answer types.
    const rounded = document.querySelectorAll('.rounded-full');
    expect(rounded.length).toBeGreaterThan(0);
  });
});

describe('QuestionCard - MULTIPLE_CHOICE', () => {
  it('renders checkbox-style (square) indicators and supports multiple selections', () => {
    renderCard({ type: 'MULTIPLE_CHOICE', selectedAnswers: ['A', 'C'] });
    expect(screen.getByText('Nhiều đáp án')).toBeInTheDocument();
    // Square indicators (rounded-[6px]) are used for multi-choice.
    const square = document.querySelectorAll('.rounded-\\[6px\\]');
    expect(square.length).toBeGreaterThan(0);
  });

  it('highlights every key present in selectedAnswers (multiple at once)', () => {
    renderCard({ type: 'MULTIPLE_CHOICE', selectedAnswers: ['A', 'C'] });

    const optionA = screen.getByText('Đáp án A').closest('button')!;
    const optionB = screen.getByText('Đáp án B').closest('button')!;
    const optionC = screen.getByText('Đáp án C').closest('button')!;

    // Selected options carry the selected-border class; unselected do not.
    expect(optionA.className).toContain('border-[var(--option-border-selected)]');
    expect(optionC.className).toContain('border-[var(--option-border-selected)]');
    expect(optionB.className).not.toContain('border-[var(--option-border-selected)]');
  });

  it('reports each clicked key independently so the parent can toggle multi-select', async () => {
    const user = userEvent.setup();
    const { onSelectAnswer } = renderCard({ type: 'MULTIPLE_CHOICE' });

    await user.click(screen.getByRole('button', { name: /Đáp án A/ }));
    await user.click(screen.getByRole('button', { name: /Đáp án C/ }));

    expect(onSelectAnswer).toHaveBeenNthCalledWith(1, 'A');
    expect(onSelectAnswer).toHaveBeenNthCalledWith(2, 'C');
  });
});

describe('QuestionCard - TRUE_FALSE', () => {
  it('renders as a single-answer style (round indicators) with the "Đúng / Sai" label', () => {
    renderCard({
      type: 'TRUE_FALSE',
      options: [
        { key: 'A', value: 'Đúng' },
        { key: 'B', value: 'Sai' },
      ],
    });
    expect(screen.getByText('Đúng / Sai')).toBeInTheDocument();
    expect(screen.getByText('Đúng')).toBeInTheDocument();
    expect(screen.getByText('Sai')).toBeInTheDocument();
    const rounded = document.querySelectorAll('.rounded-full');
    expect(rounded.length).toBeGreaterThan(0);
  });

  it('calls onSelectAnswer with the chosen key', async () => {
    const user = userEvent.setup();
    const { onSelectAnswer } = renderCard({
      type: 'TRUE_FALSE',
      options: [
        { key: 'A', value: 'Đúng' },
        { key: 'B', value: 'Sai' },
      ],
    });
    await user.click(screen.getByRole('button', { name: /Đúng/ }));
    expect(onSelectAnswer).toHaveBeenCalledWith('A');
  });
});

describe('QuestionCard - selected answer highlighting', () => {
  it('highlights the selected option and not the others', () => {
    renderCard({ type: 'SINGLE_CHOICE', selectedAnswers: ['B'] });

    const optionA = screen.getByText('Đáp án A').closest('button')!;
    const optionB = screen.getByText('Đáp án B').closest('button')!;

    expect(optionB.className).toContain('border-[var(--option-border-selected)]');
    expect(optionA.className).not.toContain('border-[var(--option-border-selected)]');
  });
});

describe('QuestionCard - difficulty label', () => {
  it.each([
    ['DE', 'Dễ'],
    ['TRUNG_BINH', 'Trung bình'],
    ['KHO', 'Khó'],
  ])('renders difficulty %s as "%s"', (difficulty, label) => {
    renderCard({ difficulty });
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('falls back to "Dễ" for an unknown difficulty value', () => {
    renderCard({ difficulty: 'UNKNOWN_LEVEL' });
    expect(screen.getByText('Dễ')).toBeInTheDocument();
  });

  it('renders the question number / total', () => {
    renderCard({ questionNumber: 3, totalQuestions: 20 });
    // Number and total are rendered together: "Câu hỏi 3 / 20 — Dễ"
    expect(screen.getByText(/Câu hỏi 3 \/ 20/)).toBeInTheDocument();
  });
});

describe('QuestionCard - question content', () => {
  it('renders HTML question content', () => {
    renderCard({ content: 'Chọn đáp án <strong>đúng</strong> nhất' });
    expect(screen.getByText('đúng').tagName).toBe('STRONG');
  });
});

/**
 * IMAGE-BASED QUESTIONS (câu hình ảnh) - US-050.
 */
describe('QuestionCard - image question', () => {
  it('renders an <img> when the question carries a media URL', () => {
    const mediaUrl = 'https://example.com/diagram.png';
    renderCard({ type: 'SINGLE_CHOICE', mediaUrl });

    const img = screen.queryByRole('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', mediaUrl);
    expect(img).toHaveAttribute('alt', 'Hình ảnh câu hỏi');
  });

  it('does NOT render an <img> when mediaUrl is null (edge case)', () => {
    renderCard({ type: 'SINGLE_CHOICE', mediaUrl: null });
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('does NOT render an <img> when mediaUrl is absent (edge case)', () => {
    renderCard({ type: 'SINGLE_CHOICE' });
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});

/**
 * VIDEO-BASED QUESTIONS (câu video) - US-051 (BUG-FE-002).
 */
describe('QuestionCard - video question', () => {
  it('renders a <video> with the correct src when mediaType is VIDEO', () => {
    const mediaUrl = 'https://example.com/clip.mp4';
    const { container } = renderCard({
      type: 'SINGLE_CHOICE',
      mediaUrl,
      mediaType: 'VIDEO',
    });

    const video = container.querySelector('video');
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute('src', mediaUrl);
    // Has player controls and is accessible via a Vietnamese label.
    expect(video).toHaveAttribute('controls');
    expect(screen.getByLabelText('Video câu hỏi')).toBeInTheDocument();
    // Must NOT autoplay.
    expect(video).not.toHaveAttribute('autoplay');
    expect((video as HTMLVideoElement | null)?.autoplay).toBe(false);
    // No <img> / <audio> for a video question.
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(container.querySelector('audio')).not.toBeInTheDocument();
  });

  it('does NOT render media when mediaUrl is null but mediaType is VIDEO (edge case)', () => {
    const { container } = renderCard({
      type: 'SINGLE_CHOICE',
      mediaUrl: null,
      mediaType: 'VIDEO',
    });
    expect(container.querySelector('video')).not.toBeInTheDocument();
    expect(container.querySelector('audio')).not.toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});

/**
 * AUDIO-BASED QUESTIONS (câu âm thanh) - US-052 (BUG-FE-003).
 */
describe('QuestionCard - audio question', () => {
  it('renders an <audio> with the correct src when mediaType is AUDIO', () => {
    const mediaUrl = 'https://example.com/sound.mp3';
    const { container } = renderCard({
      type: 'SINGLE_CHOICE',
      mediaUrl,
      mediaType: 'AUDIO',
    });

    const audio = container.querySelector('audio');
    expect(audio).toBeInTheDocument();
    expect(audio).toHaveAttribute('src', mediaUrl);
    expect(audio).toHaveAttribute('controls');
    expect(screen.getByLabelText('Âm thanh câu hỏi')).toBeInTheDocument();
    // No <img> / <video> for an audio question.
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(container.querySelector('video')).not.toBeInTheDocument();
  });

  it('does NOT render media when mediaUrl is null but mediaType is AUDIO (edge case)', () => {
    const { container } = renderCard({
      type: 'SINGLE_CHOICE',
      mediaUrl: null,
      mediaType: 'AUDIO',
    });
    expect(container.querySelector('audio')).not.toBeInTheDocument();
    expect(container.querySelector('video')).not.toBeInTheDocument();
  });
});

/**
 * IMAGE FALLBACK (no regression) - US-050 / US-051 / US-052.
 */
describe('QuestionCard - image fallback (no regression)', () => {
  it('still renders an <img> when mediaType is explicitly IMAGE', () => {
    const mediaUrl = 'https://example.com/diagram.png';
    const { container } = renderCard({
      type: 'SINGLE_CHOICE',
      mediaUrl,
      mediaType: 'IMAGE',
    });

    const img = screen.queryByRole('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', mediaUrl);
    expect(container.querySelector('video')).not.toBeInTheDocument();
    expect(container.querySelector('audio')).not.toBeInTheDocument();
  });

  it('renders an <img> when mediaUrl is present but mediaType is not provided', () => {
    const mediaUrl = 'https://example.com/diagram.png';
    const { container } = renderCard({ type: 'SINGLE_CHOICE', mediaUrl });

    expect(screen.queryByRole('img')).toBeInTheDocument();
    expect(container.querySelector('video')).not.toBeInTheDocument();
    expect(container.querySelector('audio')).not.toBeInTheDocument();
  });
});

/**
 * HOTSPOT — chọn vùng ảnh (Hot Area / Point and Shoot). Nhóm câu đồ hoạ.
 */
describe('QuestionCard - HOTSPOT (chọn vùng ảnh)', () => {
  const IMG = 'https://example.com/flag.png';

  // jsdom trả rect 0x0 -> ép kích thước để tính toạ độ chuẩn hoá.
  function mockRect(el: Element) {
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 200,
      height: 100,
      right: 200,
      bottom: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);
  }

  it('hiển thị nhãn "Chọn vùng ảnh" + ảnh nền click được (không kèm ảnh thường)', () => {
    renderCard({ type: 'HOTSPOT', mediaUrl: IMG, onTextAnswer: vi.fn() });
    expect(screen.getByText('Chọn vùng ảnh')).toBeInTheDocument();
    const zone = screen.getByRole('button', { name: /Vùng chọn trên ảnh/ });
    expect(zone).toBeInTheDocument();
    // Ảnh nằm trong vùng click; alt là "Ảnh chọn vùng" (không phải ảnh thường).
    expect(screen.getByAltText('Ảnh chọn vùng')).toHaveAttribute('src', IMG);
    expect(screen.queryByAltText('Hình ảnh câu hỏi')).not.toBeInTheDocument();
  });

  it('click vào ảnh -> onTextAnswer nhận toạ độ CHUẨN HOÁ "x,y"', () => {
    const onTextAnswer = vi.fn();
    renderCard({ type: 'HOTSPOT', mediaUrl: IMG, onTextAnswer });
    const zone = screen.getByRole('button', { name: /Vùng chọn trên ảnh/ });
    mockRect(zone);
    fireEvent.click(zone, { clientX: 100, clientY: 50 }); // giữa -> 0.5,0.5
    expect(onTextAnswer).toHaveBeenCalledWith('0.5,0.5');
  });

  it('click thêm điểm thứ 2 -> nối chuỗi "x,y;x,y"', () => {
    const onTextAnswer = vi.fn();
    renderCard({
      type: 'HOTSPOT',
      mediaUrl: IMG,
      selectedAnswers: ['0.5,0.5'],
      onTextAnswer,
    });
    const zone = screen.getByRole('button', { name: /Vùng chọn trên ảnh/ });
    mockRect(zone);
    fireEvent.click(zone, { clientX: 50, clientY: 25 }); // 0.25,0.25
    expect(onTextAnswer).toHaveBeenCalledWith('0.5,0.5;0.25,0.25');
  });

  it('các điểm đã chọn hiển thị thành dấu đánh số; click dấu để XOÁ điểm đó', () => {
    const onTextAnswer = vi.fn();
    renderCard({
      type: 'HOTSPOT',
      mediaUrl: IMG,
      selectedAnswers: ['0.2,0.3;0.6,0.7'],
      onTextAnswer,
    });
    // 2 dấu: "Điểm đã chọn 1" và "2".
    const marker1 = screen.getByRole('button', { name: 'Điểm đã chọn 1' });
    expect(screen.getByRole('button', { name: 'Điểm đã chọn 2' })).toBeInTheDocument();
    fireEvent.click(marker1); // xoá điểm 1 -> còn lại điểm 2
    expect(onTextAnswer).toHaveBeenCalledWith('0.6,0.7');
  });

  it('nút "Xoá hết" gọi onTextAnswer("")', () => {
    const onTextAnswer = vi.fn();
    renderCard({
      type: 'HOTSPOT',
      mediaUrl: IMG,
      selectedAnswers: ['0.2,0.3'],
      onTextAnswer,
    });
    fireEvent.click(screen.getByRole('button', { name: 'Xoá hết' }));
    expect(onTextAnswer).toHaveBeenCalledWith('');
  });
});

/**
 * CONTENT SANITIZATION (XSS) - BUG-FE-005.
 */
describe('QuestionCard - content sanitization (XSS)', () => {
  it('strips <script> tags from question content', () => {
    renderCard({
      content: 'An toàn?<script>window.__xss = true;</script>',
    });
    expect(document.querySelector('script')).toBeNull();
    expect((window as unknown as { __xss?: boolean }).__xss).toBeUndefined();
    expect(screen.getByText(/An toàn\?/)).toBeInTheDocument();
  });

  it('removes onerror / inline event handlers from injected HTML', () => {
    renderCard({
      content: '<img src="x" onerror="window.__xss2 = true" />',
    });
    const injected = document.querySelector('img');
    // If an <img> survives sanitization it must NOT carry the onerror handler.
    if (injected) {
      expect(injected.getAttribute('onerror')).toBeNull();
    }
    expect((window as unknown as { __xss2?: boolean }).__xss2).toBeUndefined();
  });
});

/**
 * SINGLE-SELECTION SEMANTICS - US-047 / US-049 (BUG-FE-004).
 */
describe('QuestionCard - single-selection semantics', () => {
  it('exposes a radiogroup for SINGLE_CHOICE questions', () => {
    renderCard({ type: 'SINGLE_CHOICE' });
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
  });

  it('exposes a radiogroup for TRUE_FALSE questions', () => {
    renderCard({
      type: 'TRUE_FALSE',
      options: [
        { key: 'A', value: 'Đúng' },
        { key: 'B', value: 'Sai' },
      ],
    });
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
  });

  it('does NOT use a radiogroup for MULTIPLE_CHOICE questions', () => {
    renderCard({ type: 'MULTIPLE_CHOICE' });
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
  });

  it('highlights only ONE option for SINGLE_CHOICE even if the parent passes several keys (error case)', () => {
    // Defensive: even if upstream state is corrupted with multiple selections,
    // a single-answer question must never show two selected radios.
    renderCard({ type: 'SINGLE_CHOICE', selectedAnswers: ['A', 'B', 'C'] });

    const selected = document
      .querySelectorAll('button')
      [0]?.parentElement?.querySelectorAll(
        'button[aria-checked="true"]',
      );
    expect(selected?.length).toBe(1);
  });

  it('marks aria-checked=true only on the single effective selection', () => {
    renderCard({ type: 'SINGLE_CHOICE', selectedAnswers: ['B', 'D'] });
    const optionB = screen.getByText('Đáp án B').closest('button')!;
    const optionD = screen.getByText('Đáp án D').closest('button')!;
    expect(optionB).toHaveAttribute('aria-checked', 'true');
    expect(optionD).toHaveAttribute('aria-checked', 'false');
  });
});

/**
 * EDGE / ERROR CASES - US-047 / 048 / 049 / 050 (Bảng 5.1).
 */
describe('QuestionCard - edge & error cases', () => {
  it('renders without crashing when options is empty (edge case)', () => {
    renderCard({ options: [] });
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    // The question stem still renders.
    expect(screen.getByText(/Thủ đô của Việt Nam/)).toBeInTheDocument();
  });

  it('renders without crashing when selectedAnswers is empty (edge case)', () => {
    renderCard({ selectedAnswers: [] });
    const anySelected = document.querySelectorAll(
      'button[aria-checked="true"]',
    );
    expect(anySelected).toHaveLength(0);
  });

  it('falls back to single-choice config for an invalid type (error case)', () => {
    // @ts-expect-error - intentionally invalid type to exercise the fallback.
    renderCard({ type: 'NOT_A_REAL_TYPE' });
    // Should not throw; options still render.
    expect(screen.getAllByRole('button')).toHaveLength(baseOptions.length);
  });

  it('does not throw on empty content (error case)', () => {
    expect(() => renderCard({ content: '' })).not.toThrow();
  });
});
