'use client';

import { type ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className = '' }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Modal Content */}
      <div
        className={`glass-heavy relative z-10 w-full animate-[page-enter_200ms_cubic-bezier(0.16,1,0.3,1)] ${
          className.includes('max-w-') ? '' : 'max-w-md'
        } ${className.includes('p-') ? '' : 'p-8'} ${className}`}
      >
        {title && (
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-[var(--text-primary)]">{title}</h3>
            <button
              onClick={onClose}
              className="glass-btn p-2 rounded-lg hover:scale-105 active:scale-95 cursor-pointer"
            >
              <X className="w-4 h-4 text-[var(--text-secondary)]" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
