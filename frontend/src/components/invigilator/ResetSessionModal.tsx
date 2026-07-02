'use client';

import { Modal } from '@/components/ui/Modal';
import { Power, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ResetSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  studentName: string;
  studentId: string;
}

export function ResetSessionModal({
  isOpen,
  onClose,
  onConfirm,
  studentName,
  studentId,
}: ResetSessionModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Khôi phục Phiên đăng nhập" className="max-w-md p-6">
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4">
          <Power className="w-8 h-8" />
        </div>
        
        <p className="text-[14px] text-[var(--text-secondary)] mb-6">
          Bạn đang yêu cầu đóng phiên làm việc hiện tại của sinh viên 
          <strong className="text-[var(--text-primary)] block mt-1 text-lg">{studentName} ({studentId})</strong>
        </p>

        <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl p-4 flex items-start gap-3 text-left w-full mb-6">
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 mt-0.5 flex-shrink-0" />
          <p className="text-[13px] text-rose-700 dark:text-rose-300 leading-relaxed">
            Hành động này sẽ <strong>buộc tài khoản bị đăng xuất khỏi thiết bị cũ</strong>. 
            Nên sử dụng khi sinh viên gặp sự cố hỏng máy và cần chuyển sang thiết bị mới để thi tiếp.
          </p>
        </div>

        <div className="flex w-full gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1 py-2.5">
            Hủy bỏ
          </Button>
          <Button 
            variant="primary" 
            onClick={onConfirm} 
            className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-700 text-white border-0 shadow-rose-500/30 shadow-lg"
          >
            Đồng ý khôi phục
          </Button>
        </div>
      </div>
    </Modal>
  );
}
