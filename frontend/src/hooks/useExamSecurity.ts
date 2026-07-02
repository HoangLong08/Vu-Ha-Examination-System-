'use client';

import { useEffect, useCallback } from 'react';

export const useExamSecurity = (attemptId: string, isExamActive: boolean) => {
  const logViolation = useCallback(
    async (type: string, description: string) => {
      try {
        await fetch('/api/v1/violations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            attemptId,
            type,
            description,
            timestamp: new Date().toISOString(),
          }),
        });
      } catch (err) {
        console.error('Không thể gửi cảnh báo vi phạm:', err);
      }
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
