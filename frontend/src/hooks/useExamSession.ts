'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  startExam,
  getAttemptAnswers,
  getExamQuestions,
  saveAnswer,
  autosaveAnswers,
  submitAttempt,
  type AttemptAnswer,
  type AutosaveItem,
  type ExamQuestion,
} from '@/services/api';
import {
  saveAnswerLocally,
  getUnsynced,
  markSynced,
  type LocalAnswer,
} from '@/services/indexedDbService';

export type AnswersMap = Record<string, string[]>;

/** Question shape ready for <QuestionCard>: media type derived from mediaUrl. */
export interface ExamQuestionView {
  id: string;
  type:
    | 'SINGLE_CHOICE'
    | 'MULTIPLE_CHOICE'
    | 'TRUE_FALSE'
    | 'FILL_BLANK'
    | 'NUMERIC'
    | 'ESSAY'
    | 'MATCHING'
    | 'ORDERING'
    | 'CLASSIFY'
    | 'HOTSPOT';
  content: string;
  options: { key: string; value: string }[];
  items?: { key: string; value: string }[];
  targets?: { key: string; value: string }[];
  difficulty?: string;
  mediaUrl?: string | null;
  mediaType?: 'IMAGE' | undefined;
}

/** Map a backend question to the FE view: derive mediaType from mediaUrl. */
function toQuestionView(q: ExamQuestion): ExamQuestionView {
  return {
    id: q.id,
    type: q.type,
    content: q.content,
    options: q.options,
    items: q.items,
    targets: q.targets,
    difficulty: q.difficulty,
    mediaUrl: q.mediaUrl,
    mediaType: q.mediaUrl ? 'IMAGE' : undefined,
  };
}

// ── Pure helpers (exported for unit testing) ─────────────────────────────────

/** Encode a FE answer array into the backend CHUỖI form, e.g. ['A','C'] → "A,C". */
export function encodeAnswer(value: string[]): string {
  return value.join(',');
}

/** Decode a backend CHUỖI into the FE array form, e.g. "A,C" → ['A','C']. */
export function decodeAnswer(value: string | null | undefined): string[] {
  if (!value) return [];
  return value.split(',').filter(Boolean);
}

/**
 * Merge server answers (source of truth) with locally-stored unsynced answers.
 * Rule: newest `timestamp` wins per questionId, so a more recent local edit made
 * while offline beats the server copy and vice-versa.
 */
export function mergeRecovery(
  serverAnswers: AttemptAnswer[],
  localUnsynced: Pick<LocalAnswer, 'questionId' | 'answerValue' | 'timestamp'>[]
): AnswersMap {
  const result: AnswersMap = {};
  const timestamps: Record<string, string> = {};

  for (const s of serverAnswers) {
    result[s.questionId] = decodeAnswer(s.answerValue);
    timestamps[s.questionId] = s.answeredAt ?? '';
  }

  for (const l of localUnsynced) {
    const existingTs = timestamps[l.questionId];
    // Local wins when there's no server entry or its timestamp is newer.
    if (!existingTs || (l.timestamp && l.timestamp > existingTs)) {
      result[l.questionId] = l.answerValue;
      timestamps[l.questionId] = l.timestamp;
    }
  }

  return result;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

interface ExamSessionState {
  attemptId: string | null;
  answers: AnswersMap;
  questions: ExamQuestionView[];
  remainingSeconds: number;
  status: string;
  recovered: boolean;
  isOnline: boolean;
  loading: boolean;
  error: string | null;
}

export function useExamSession(examId: string) {
  const [state, setState] = useState<ExamSessionState>({
    attemptId: null,
    answers: {},
    questions: [],
    remainingSeconds: 0,
    status: '',
    recovered: false,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    loading: true,
    error: null,
  });

  const attemptIdRef = useRef<string | null>(null);
  // Bộ đếm debounce gửi server cho câu GÕ TEXT (mỗi câu 1 timer).
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Gửi 1 đáp án lên server + đánh dấu đã đồng bộ (best-effort).
  const pushAnswer = useCallback((questionId: string, value: string[]) => {
    const attemptId = attemptIdRef.current;
    if (!attemptId) return;
    saveAnswer(attemptId, questionId, encodeAnswer(value))
      .then(() => markSynced(questionId))
      .catch((err) => {
        // Lỗi mạng: giữ bản local chưa sync để retry (sync 30s / flush khi nộp).
        console.error('useExamSession: saveAnswer failed', err);
      });
  }, []);

  // Flush unsynced local answers to the server (batch).
  const syncToServer = useCallback(async () => {
    const attemptId = attemptIdRef.current;
    if (!attemptId) return;
    try {
      const unsynced = await getUnsynced();
      if (unsynced.length === 0) return;
      const items: AutosaveItem[] = unsynced.map((a) => ({
        questionId: a.questionId,
        answer: encodeAnswer(a.answerValue),
        timestamp: a.timestamp,
      }));
      await autosaveAnswers(attemptId, items);
      await Promise.all(unsynced.map((a) => markSynced(a.questionId)));
    } catch (err) {
      console.error('useExamSession: sync to server failed', err);
    }
  }, []);

  // Mount: start (or recover) the attempt, then build the answers map.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const started = await startExam(examId);
        if (cancelled) return;
        attemptIdRef.current = started.attemptId;

        let serverAnswers: AttemptAnswer[] = [];
        try {
          serverAnswers = await getAttemptAnswers(started.attemptId);
        } catch (err) {
          console.error('useExamSession: failed to load server answers', err);
        }

        // Load the REAL questions from the backend so answer IDs match the
        // grading snapshot. A failure here must not crash the session.
        let questions: ExamQuestionView[] = [];
        let questionsError: string | null = null;
        try {
          const raw = await getExamQuestions(examId);
          questions = raw.map(toQuestionView);
        } catch (err) {
          console.error('useExamSession: failed to load questions', err);
          questionsError = 'Không thể tải đề thi. Vui lòng tải lại trang.';
        }

        let localUnsynced: LocalAnswer[] = [];
        try {
          localUnsynced = await getUnsynced();
        } catch (err) {
          console.error('useExamSession: failed to read local answers', err);
        }

        if (cancelled) return;
        const merged = mergeRecovery(serverAnswers, localUnsynced);

        setState((prev) => ({
          ...prev,
          attemptId: started.attemptId,
          answers: merged,
          questions,
          remainingSeconds: started.remainingSeconds,
          status: started.status,
          recovered: started.recovered,
          loading: false,
          error: questionsError,
        }));

        // Push any offline edits that won the merge up to the server.
        void syncToServer();
      } catch (err) {
        console.error('useExamSession: failed to start exam', err);
        if (cancelled) return;
        // Ưu tiên thông báo nghiệp vụ từ backend (vd hết số lần thi, ngoài dải IP).
        const apiMsg = (
          err as { response?: { data?: { message?: string } } }
        )?.response?.data?.message;
        setState((prev) => ({
          ...prev,
          loading: false,
          error:
            apiMsg ||
            'Không thể bắt đầu hoặc khôi phục bài thi. Vui lòng thử lại.',
        }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [examId, syncToServer]);

  // Track connectivity; sync immediately on reconnect.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleOnline = () => {
      setState((prev) => ({ ...prev, isOnline: true }));
      void syncToServer();
    };
    const handleOffline = () => {
      setState((prev) => ({ ...prev, isOnline: false }));
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncToServer]);

  // Periodic flush every 30s.
  useEffect(() => {
    const interval = setInterval(() => {
      void syncToServer();
    }, 30000);
    return () => clearInterval(interval);
  }, [syncToServer]);

  /**
   * Chọn/nhập đáp án. PHÂN DẠNG theo cách tương tác:
   *  - `debounce=false` (mặc định) — loại CLICK/CHỌN (trắc nghiệm, đối sánh,
   *    hotspot): cập nhật + lưu local + gửi server NGAY (1 request/lần chọn).
   *  - `debounce=true` — loại GÕ TEXT (điền khuyết/giá trị, tự luận): cập nhật +
   *    lưu local NGAY (offline-safe), nhưng GỬI SERVER hoãn ~600ms sau khi ngừng
   *    gõ (tránh bắn request mỗi phím). Vẫn được flush khi nộp / sync định kỳ.
   */
  const selectAnswer = useCallback(
    (questionId: string, value: string[], debounce = false) => {
      setState((prev) => ({
        ...prev,
        answers: { ...prev.answers, [questionId]: value },
      }));
      // Luôn lưu local trước (an toàn khi mất mạng/tắt máy).
      void saveAnswerLocally(questionId, value);
      const attemptId = attemptIdRef.current;
      if (!attemptId) return;

      // Huỷ timer cũ của câu này (nếu có) để gộp các lần gõ liên tiếp.
      if (saveTimers.current[questionId]) {
        clearTimeout(saveTimers.current[questionId]);
        delete saveTimers.current[questionId];
      }
      if (debounce) {
        saveTimers.current[questionId] = setTimeout(() => {
          delete saveTimers.current[questionId];
          pushAnswer(questionId, value);
        }, 600);
      } else {
        pushAnswer(questionId, value);
      }
    },
    [pushAnswer]
  );

  const submit = useCallback(async () => {
    const attemptId = attemptIdRef.current;
    if (!attemptId) {
      throw new Error('Không có attemptId để nộp bài.');
    }
    // Huỷ mọi timer debounce đang chờ (bản local đã có, syncToServer sẽ gửi nốt).
    Object.values(saveTimers.current).forEach(clearTimeout);
    saveTimers.current = {};
    // Best-effort flush any pending local answers before finalizing.
    await syncToServer();
    return submitAttempt(attemptId);
  }, [syncToServer]);

  // Dọn timer khi rời màn (tránh gửi đáp án sau khi unmount).
  useEffect(() => {
    const timers = saveTimers.current;
    return () => {
      Object.values(timers).forEach(clearTimeout);
    };
  }, []);

  return {
    attemptId: state.attemptId,
    answers: state.answers,
    questions: state.questions,
    remainingSeconds: state.remainingSeconds,
    status: state.status,
    recovered: state.recovered,
    isOnline: state.isOnline,
    selectAnswer,
    submit,
    loading: state.loading,
    error: state.error,
  };
}
