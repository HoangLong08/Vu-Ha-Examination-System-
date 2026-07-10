'use client';

import { type ReactNode } from 'react';
import { LogOut, ChevronDown } from 'lucide-react';
import { BrandLogo } from '../ui/BrandLogo';
import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useRouter } from 'next/navigation';

export function StudentLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex flex-col relative z-[1]">
      {/* Simple Header without Sidebar */}
      <header className="glass-header sticky top-0 z-40 h-[72px] flex items-center justify-between px-6 sm:px-8 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-3">
          <BrandLogo size={40} bare />
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)] leading-none mb-1">
              DAU Exam
            </h1>
            <p className="text-[11px] text-[var(--text-secondary)] font-medium tracking-wide uppercase">
              Hệ thống trắc nghiệm
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <div className="h-6 w-px bg-[var(--border-subtle)] mx-1" />
          {/* Khu vực người dùng — rê vào (hoặc focus) để xổ menu Đăng xuất */}
          <div className="group relative">
            <button
              type="button"
              className="flex items-center gap-3 rounded-xl pl-2.5 pr-2 py-1.5 hover:bg-[var(--bg-glass-light)] transition-colors"
            >
              <div className="text-right hidden sm:block">
                <p className="text-[13px] font-bold text-[var(--text-primary)] leading-tight">
                  {user?.lastName} {user?.firstName}
                </p>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  {user?.studentInfo?.classId || 'Sinh viên'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt="Avatar"
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  user?.firstName?.charAt(0) || 'U'
                )}
              </div>
              <ChevronDown className="w-4 h-4 text-[var(--text-secondary)] transition-transform duration-200 group-hover:rotate-180" />
            </button>

            {/* Menu xổ xuống — pt-2 làm "cầu" giữ hover, không bị mất khi rê xuống */}
            <div className="absolute right-0 top-full pt-2 w-44 opacity-0 invisible translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 transition-all duration-200 z-50">
              <div className="glass-heavy rounded-xl border border-[var(--border-subtle)] shadow-lg p-1.5">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut className="w-[18px] h-[18px]" /> Đăng xuất
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-8 page-enter">
        {children}
      </main>
    </div>
  );
}
