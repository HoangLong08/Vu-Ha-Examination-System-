import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import {
  encodeAnswer,
  decodeAnswer,
  mergeRecovery,
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
