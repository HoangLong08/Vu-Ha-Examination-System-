'use client';

import { useEffect, useCallback } from 'react';
import { saveAnswerLocally, getUnsynced, markSynced } from '@/services/indexedDbService';
import { autosaveAnswers, type AutosaveItem } from '@/services/api';

/**
 * Auto-save hook (EPIC-13).
 *
 * - Persists answers to IndexedDB immediately (offline-safe).
 * - Periodically (30s) flushes unsynced local answers to the server via the
 *   batch autosave endpoint `POST /attempts/:id/autosave`.
 * - Also flushes immediately when the browser regains connectivity ('online').
 */
export function useAutoSave(attemptId: string, isActive: boolean) {
  const saveToLocal = useCallback(
    async (questionId: string, answerValue: string[]) => {
      await saveAnswerLocally(questionId, answerValue);
    },
    []
  );

  const syncToServer = useCallback(async () => {
    if (!attemptId) return;
    try {
      const unsynced = await getUnsynced();
      if (unsynced.length === 0) return;

      const items: AutosaveItem[] = unsynced.map((a) => ({
        questionId: a.questionId,
        answer: a.answerValue.join(','),
        timestamp: a.timestamp,
      }));

      await autosaveAnswers(attemptId, items);

      // Mark each as synced only after a successful round-trip.
      await Promise.all(unsynced.map((a) => markSynced(a.questionId)));
    } catch (err) {
      // Swallow network errors — local copy is retained and retried later.
      console.error('Auto-save sync to server failed:', err);
    }
  }, [attemptId]);

  // Periodic flush every 30s while the attempt is active.
  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(syncToServer, 30000);
    return () => clearInterval(interval);
  }, [isActive, syncToServer]);

  // Immediate flush when connectivity is restored.
  useEffect(() => {
    if (!isActive || typeof window === 'undefined') return;
    const handleOnline = () => {
      void syncToServer();
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [isActive, syncToServer]);

  return { saveToLocal, syncToServer };
}
