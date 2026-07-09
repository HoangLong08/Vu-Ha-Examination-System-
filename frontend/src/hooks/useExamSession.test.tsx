import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import {
  encodeAnswer,
  decodeAnswer,
  mergeRecovery,
  useExamSession,
} from './useExamSession';

// ── Mock the data layer so hooks/helpers run without real network or Dexie. ──
vi.mock('@/services/api', () => ({
  startExam: vi.fn(),
  getAttemptAnswers: vi.fn(),
  getExamQuestions: vi.fn(async () => []),
  saveAnswer: vi.fn(),
  autosaveAnswers: vi.fn(),
  submitAttempt: vi.fn(),
}));

vi.mock('@/services/indexedDbService', () => ({
  saveAnswerLocally: vi.fn(async () => {}),
  getUnsynced: vi.fn(async () => []),
  markSynced: vi.fn(async () => {}),
}));

import { useAutoSave } from './useAutoSave';
import * as api from '@/services/api';
import * as idb from '@/services/indexedDbService';

// ─────────────────────────────────────────────────────────────────────────────
// Pure encode/decode of the FE array ↔ backend CHUỖI form.
// ─────────────────────────────────────────────────────────────────────────────
describe('answer encode/decode', () => {
  it('encodes an array to a comma-joined string', () => {
    expect(encodeAnswer(['A', 'C'])).toBe('A,C');
    expect(encodeAnswer(['B'])).toBe('B');
    expect(encodeAnswer([])).toBe('');
  });

  it('decodes a backend string into an array, dropping empties', () => {
    expect(decodeAnswer('A,C')).toEqual(['A', 'C']);
    expect(decodeAnswer('B')).toEqual(['B']);
    expect(decodeAnswer('')).toEqual([]);
    expect(decodeAnswer(null)).toEqual([]);
    expect(decodeAnswer(undefined)).toEqual([]);
  });

  it('round-trips A,C through decode → encode', () => {
    expect(encodeAnswer(decodeAnswer('A,C'))).toBe('A,C');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Recovery merge: server is the baseline; newest timestamp wins.
// ─────────────────────────────────────────────────────────────────────────────
describe('mergeRecovery', () => {
  it('decodes server answers ("A,C" → [A,C]) when there is no local copy', () => {
    const merged = mergeRecovery(
      [{ questionId: 'q1', answerValue: 'A,C', answeredAt: '2026-06-12T10:00:00.000Z' }],
      []
    );
    expect(merged).toEqual({ q1: ['A', 'C'] });
  });

  it('lets a NEWER local answer win over the server copy', () => {
    const merged = mergeRecovery(
      [{ questionId: 'q1', answerValue: 'A', answeredAt: '2026-06-12T10:00:00.000Z' }],
      [{ questionId: 'q1', answerValue: ['B'], timestamp: '2026-06-12T10:05:00.000Z' }]
    );
    expect(merged.q1).toEqual(['B']);
  });

  it('keeps the server copy when the local answer is OLDER', () => {
    const merged = mergeRecovery(
      [{ questionId: 'q1', answerValue: 'A', answeredAt: '2026-06-12T10:05:00.000Z' }],
      [{ questionId: 'q1', answerValue: ['B'], timestamp: '2026-06-12T10:00:00.000Z' }]
    );
    expect(merged.q1).toEqual(['A']);
  });

  it('adds local-only answers that the server has never seen', () => {
    const merged = mergeRecovery(
      [{ questionId: 'q1', answerValue: 'A', answeredAt: '2026-06-12T10:00:00.000Z' }],
      [{ questionId: 'q2', answerValue: ['D'], timestamp: '2026-06-12T10:01:00.000Z' }]
    );
    expect(merged).toEqual({ q1: ['A'], q2: ['D'] });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// startExam failure (maxAttempt=1, finishedCount=1): FR-Q-003 — no new attempt
// is allowed, and the hook must surface a friendly error without touching
// recovery/questions APIs.
// ─────────────────────────────────────────────────────────────────────────────
describe('useExamSession — start exam blocked by max attempt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sets error + errorCode and does NOT load answers/questions when startExam is rejected (maxAttempt=1, finishedCount=1)', async () => {
    (api.startExam as ReturnType<typeof vi.fn>).mockRejectedValue({
      response: {
        status: 400,
        data: {
          statusCode: 400,
          code: 'EXAM_ATTEMPT_LIMIT_REACHED',
          message:
            'Bạn đã hoàn thành bài thi này và đã sử dụng hết số lần thi được phép.',
        },
      },
    });
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useExamSession('exam-1'));

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.errorCode).toBe('EXAM_ATTEMPT_LIMIT_REACHED');
    expect(result.current.error).toBe(
      'Bạn đã hoàn thành bài thi này và đã sử dụng hết số lần thi được phép.'
    );
    expect(result.current.attemptId).toBeNull();
    expect(api.getAttemptAnswers).not.toHaveBeenCalled();
    expect(api.getExamQuestions).not.toHaveBeenCalled();
    // Đây là phản hồi nghiệp vụ đã lường trước — không được log AxiosError ra console.
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('DOES log to console for a genuinely unexpected startExam error (e.g. 500 / network)', async () => {
    (api.startExam as ReturnType<typeof vi.fn>).mockRejectedValue({
      response: { status: 500, data: { statusCode: 500, message: 'Internal server error' } },
    });
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useExamSession('exam-1'));

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.errorCode).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Timer reaches zero -> auto-submit. Backend now treats "already SUBMITTED"
// (e.g. the auto-submit cron raced ahead of the client's own submit call) as
// an idempotent success instead of HTTP 400, so submit() must resolve here
// without throwing and without any console noise.
// ─────────────────────────────────────────────────────────────────────────────
describe('useExamSession — submit on timer expiry (auto-submit)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function startSession() {
    (api.startExam as ReturnType<typeof vi.fn>).mockResolvedValue({
      attemptId: 'attempt-1',
      startedAt: new Date().toISOString(),
      remainingSeconds: 0,
      status: 'IN_PROGRESS',
      recovered: false,
    });
    (api.getAttemptAnswers as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (api.getExamQuestions as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const { result } = renderHook(() => useExamSession('exam-1'));
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });
    return result;
  }

  it('resolves successfully when the backend already auto-submitted the attempt (idempotent 200, not 400)', async () => {
    const result = await startSession();
    (api.submitAttempt as ReturnType<typeof vi.fn>).mockResolvedValue({
      attemptId: 'attempt-1',
      status: 'SUBMITTED',
      submittedAt: new Date().toISOString(),
    });
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(result.current.submit()).resolves.toMatchObject({
      status: 'SUBMITTED',
    });
    expect(api.submitAttempt).toHaveBeenCalledWith('attempt-1');
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('still rejects for a genuine submit failure so the caller can react', async () => {
    const result = await startSession();
    (api.submitAttempt as ReturnType<typeof vi.fn>).mockRejectedValue({
      response: { status: 404, data: { message: 'Attempt not found' } },
    });

    await expect(result.current.submit()).rejects.toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// useAutoSave must hit the autosave endpoint with the right batch shape.
// ─────────────────────────────────────────────────────────────────────────────
describe('useAutoSave', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('flushes unsynced local answers via autosaveAnswers with encoded CHUỖI + ISO timestamp', async () => {
    (idb.getUnsynced as ReturnType<typeof vi.fn>).mockResolvedValue([
      { questionId: 'q1', answerValue: ['A', 'C'], timestamp: '2026-06-12T10:00:00.000Z', isSynced: 0 },
      { questionId: 'q2', answerValue: ['B'], timestamp: '2026-06-12T10:01:00.000Z', isSynced: 0 },
    ]);
    (api.autosaveAnswers as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const { result } = renderHook(() => useAutoSave('attempt-xyz', true));

    await act(async () => {
      await result.current.syncToServer();
    });

    expect(api.autosaveAnswers).toHaveBeenCalledTimes(1);
    expect(api.autosaveAnswers).toHaveBeenCalledWith('attempt-xyz', [
      { questionId: 'q1', answer: 'A,C', timestamp: '2026-06-12T10:00:00.000Z' },
      { questionId: 'q2', answer: 'B', timestamp: '2026-06-12T10:01:00.000Z' },
    ]);
    // Each flushed answer is marked synced afterwards.
    expect(idb.markSynced).toHaveBeenCalledWith('q1');
    expect(idb.markSynced).toHaveBeenCalledWith('q2');
  });

  it('does nothing when there are no unsynced answers', async () => {
    (idb.getUnsynced as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const { result } = renderHook(() => useAutoSave('attempt-xyz', true));
    await act(async () => {
      await result.current.syncToServer();
    });

    expect(api.autosaveAnswers).not.toHaveBeenCalled();
    expect(idb.markSynced).not.toHaveBeenCalled();
  });

  it('does NOT mark answers synced when the server call fails (kept for retry)', async () => {
    (idb.getUnsynced as ReturnType<typeof vi.fn>).mockResolvedValue([
      { questionId: 'q1', answerValue: ['A'], timestamp: '2026-06-12T10:00:00.000Z', isSynced: 0 },
    ]);
    (api.autosaveAnswers as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('network'));

    const { result } = renderHook(() => useAutoSave('attempt-xyz', true));
    await act(async () => {
      await result.current.syncToServer();
    });

    expect(api.autosaveAnswers).toHaveBeenCalledTimes(1);
    expect(idb.markSynced).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Regression: once submit() starts (manual or timer auto-submit), the FE must
// stop sending answer mutations. The backend rejects late POST /answers with
// 400 "Attempt is SUBMITTED" — that race is now expected and must be silent.
// ─────────────────────────────────────────────────────────────────────────────
describe('useExamSession — no answer mutations survive submit start', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function startSession() {
    (api.startExam as ReturnType<typeof vi.fn>).mockResolvedValue({
      attemptId: 'attempt-1',
      startedAt: new Date().toISOString(),
      remainingSeconds: 60,
      status: 'IN_PROGRESS',
      recovered: false,
    });
    (api.getAttemptAnswers as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (api.getExamQuestions as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (idb.getUnsynced as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (api.submitAttempt as ReturnType<typeof vi.fn>).mockResolvedValue({
      attemptId: 'attempt-1',
      status: 'SUBMITTED',
      submittedAt: new Date().toISOString(),
    });

    const { result } = renderHook(() => useExamSession('exam-1'));
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });
    return result;
  }

  it('manual submit while a debounced autosave is scheduled: the debounce never fires', async () => {
    const result = await startSession();
    (api.saveAnswer as ReturnType<typeof vi.fn>).mockResolvedValue({});

    act(() => {
      // debounce=true -> queues a 600ms timer instead of saving immediately.
      result.current.selectAnswer('q1', ['A'], true);
    });
    expect(api.saveAnswer).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.submit();
    });

    // Advance well past the 600ms debounce window: it must have been cancelled.
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(api.saveAnswer).not.toHaveBeenCalled();
    expect(api.submitAttempt).toHaveBeenCalledTimes(1);
  });

  it('timer expiry auto-submit while autosave is scheduled: same guard applies', async () => {
    const result = await startSession();
    (api.saveAnswer as ReturnType<typeof vi.fn>).mockResolvedValue({});

    act(() => {
      result.current.selectAnswer('q1', ['B'], true);
    });

    // Simulate the countdown hitting zero -> ExamHeader calls the same submit().
    await act(async () => {
      await result.current.submit();
    });

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(api.saveAnswer).not.toHaveBeenCalled();
  });

  it('rapid double-click submit only calls submitAttempt once', async () => {
    const result = await startSession();

    let resolveSubmit!: (v: unknown) => void;
    (api.submitAttempt as ReturnType<typeof vi.fn>).mockReturnValue(
      new Promise((resolve) => {
        resolveSubmit = resolve;
      })
    );

    let p1!: Promise<unknown>;
    let p2!: Promise<unknown>;
    act(() => {
      p1 = result.current.submit();
      p2 = result.current.submit();
    });

    resolveSubmit({ attemptId: 'attempt-1', status: 'SUBMITTED' });
    await act(async () => {
      await Promise.all([p1, p2]);
    });

    expect(api.submitAttempt).toHaveBeenCalledTimes(1);
  });

  it('a save request already in flight when submit begins does not surface a console error on its late 400', async () => {
    const result = await startSession();

    let rejectSave!: (err: unknown) => void;
    (api.saveAnswer as ReturnType<typeof vi.fn>).mockReturnValue(
      new Promise((_resolve, reject) => {
        rejectSave = reject;
      })
    );
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    act(() => {
      // debounce=false -> fires the save immediately, leaving it "in flight".
      result.current.selectAnswer('q1', ['A'], false);
    });
    expect(api.saveAnswer).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.submit();
    });

    // The in-flight request finally settles AFTER submit began, with the
    // backend's expected "Attempt is SUBMITTED" rejection.
    await act(async () => {
      rejectSave({ response: { status: 400, data: { message: 'Attempt is SUBMITTED, cannot modify' } } });
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(api.submitAttempt).toHaveBeenCalledTimes(1);

    consoleErrorSpy.mockRestore();
  });

  it('no further POST /answers after submit begins even if selectAnswer is called again', async () => {
    const result = await startSession();
    (api.saveAnswer as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await act(async () => {
      await result.current.submit();
    });

    act(() => {
      result.current.selectAnswer('q2', ['C'], false);
    });

    expect(api.saveAnswer).not.toHaveBeenCalled();
  });
});
