'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { KeyRound, Copy, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  studentId: string;
  /** Gọi backend cấp lại mật khẩu, trả về mật khẩu mới (= mã SV). */
  onGenerate?: () => Promise<string>;
}

export function ResetPasswordModal({
  isOpen,
  onClose,
  studentName,
  studentId,
  onGenerate,
}: ResetPasswordModalProps) {
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGeneratePassword = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      // Mật khẩu mới = mã SV (backend ghi audit); fallback = mã SV nếu không có handler.
      const pwd = onGenerate ? await onGenerate() : studentId;
      setNewPassword(pwd);
    } catch {
      setError('Cấp lại mật khẩu thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (newPassword) {
      navigator.clipboard.writeText(newPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setNewPassword(null);
    setCopied(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Cấp lại mật khẩu"
      className="max-w-md p-6"
    >
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4">
          <KeyRound className="w-8 h-8" />
        </div>

        <p className="text-[14px] text-[var(--text-secondary)] mb-6">
          Cấp lại mật khẩu đăng nhập cho sinh viên
          <strong className="text-[var(--text-primary)] block mt-1 text-lg">
            {studentName} ({studentId})
          </strong>
        </p>

        {!newPassword ? (
          <>
            <p className="text-[13px] text-[var(--text-muted)] mb-6 px-4">
              Mật khẩu mới sẽ được đặt bằng <strong>mã số sinh viên</strong> để
              thí sinh đăng nhập lại vào kỳ thi.
            </p>
            {error && (
              <p className="text-[13px] font-medium text-rose-600 mb-4">
                {error}
              </p>
            )}
            <div className="flex w-full gap-3">
              <Button
                variant="secondary"
                onClick={handleClose}
                className="flex-1 py-2.5"
              >
                Hủy bỏ
              </Button>
              <Button
                variant="primary"
                onClick={handleGeneratePassword}
                disabled={loading}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700 text-white border-0 shadow-amber-500/30 shadow-lg gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Cấp lại mật khẩu
              </Button>
            </div>
          </>
        ) : (
          <div className="w-full flex flex-col items-center">
            <p className="text-[13px] text-[var(--text-secondary)] mb-3">
              Mật khẩu mới đã được tạo thành công:
            </p>
            <div className="bg-[var(--bg-glass-light)] border border-amber-500/30 rounded-xl p-5 w-full flex items-center justify-between mb-6 shadow-inner">
              <span className="text-3xl font-mono font-bold tracking-[0.2em] text-brand-600 dark:text-blue-400">
                {newPassword}
              </span>
              <button
                onClick={handleCopy}
                className="p-2.5 bg-[var(--bg-glass)] hover:bg-[var(--bg-glass-heavy)] border border-[var(--border-subtle)] rounded-lg transition-colors text-[var(--text-secondary)]"
                title="Sao chép"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-emerald-500" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-[12px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg mb-6 w-full text-left">
              Vui lòng đọc hoặc gửi mật khẩu này cho sinh viên. Mật khẩu cũ đã
              bị vô hiệu hóa.
            </p>
            <Button
              variant="primary"
              onClick={handleClose}
              className="w-full py-2.5"
            >
              Hoàn tất
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
