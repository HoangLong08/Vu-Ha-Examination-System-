'use client';

import { useEffect, useCallback } from 'react';

export const useExamSecurity = (attemptId: string, isExamActive: boolean) => {
  // NOTE: `POST /api/v1/violations` (backend/src/violations) requires
  // `studentId` + `sessionId` + `roomId` (UUIDs) and rejects unknown fields
  // (ValidationPipe forbidNonWhitelisted) — it belongs to an older
  // room/session exam model. This hook only ever has `attemptId` in scope,
  // so a call built from that shape would always be rejected by the backend
  // (previously it was also pointed at a relative `fetch('/api/v1/violations')`,
  // which resolved against the Next.js origin instead of the API host and
  // 404'd on the frontend's own router). Until violations are wired to the
  // attempt-based model, log locally instead of hammering a call that cannot
  // succeed — this still lets the security handlers below run (blocking
  // devtools shortcuts, right-click, unload) without network noise.
  const logViolation = useCallback(
    (type: string, description: string) => {
      console.warn('[exam-security] violation (not sent to backend):', {
        attemptId,
        type,
        description,
        timestamp: new Date().toISOString(),
      });
    },
    [attemptId]
  );

  useEffect(() => {
    if (!isExamActive) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.key === 'r') ||
        (e.metaKey && e.key === 'r')
      ) {
        e.preventDefault();
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        logViolation('TAB_SWITCH', 'Sinh viên ẩn trình duyệt hoặc chuyển tab');
      }
    };

    const handleWindowBlur = () => {
      logViolation(
        'WINDOW_BLUR',
        'Sinh viên thoát chế độ toàn màn hình hoặc bấm ra ngoài cửa sổ thi'
      );
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [isExamActive, logViolation]);
};
