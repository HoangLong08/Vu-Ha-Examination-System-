'use client';

import { Search, Bell, LogOut, ChevronDown } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

/** Nhãn tiếng Việt cho mã vai trò (tránh hiện "INVIGILATOR" thô). */
const ROLE_LABELS: Record<string, string> = {
  STUDENT: 'Sinh viên',
  INVIGILATOR: 'Giám thị',
  EXAM_OFFICER: 'Khảo thí',
  ADMIN: 'Quản trị',
};

/**
 * Topbar dashboard (admin/giám thị). KHÔNG hiển thị tiêu đề trang (đã có ở nội
 * dung + sidebar). Khu vực user: rê chuột (hoặc focus) để xổ menu Đăng xuất —
 * đồng bộ với cổng sinh viên.
 */
export function Header(_props: HeaderProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const roleCode = user?.roles?.[0] ?? '';
  const roleLabel = ROLE_LABELS[roleCode] ?? roleCode;

  return (
    <header className="glass-header sticky top-0 z-40 h-[72px] flex items-center justify-end px-8">
      <div className="flex items-center gap-3">
        <button className="glass-btn p-2.5 rounded-xl hover:scale-105 active:scale-95 transition-all cursor-pointer">
          <Search className="w-5 h-5 text-[var(--text-secondary)]" />
        </button>
        <button className="glass-btn p-2.5 rounded-xl hover:scale-105 active:scale-95 transition-all relative cursor-pointer mr-2">
          <Bell className="w-5 h-5 text-[var(--text-secondary)]" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--color-danger)] rounded-full border-2 border-[var(--bg-primary)]" />
        </button>

        <ThemeToggle />

        {/* Khu vực user — rê vào (hoặc focus) để xổ menu Đăng xuất */}
        <div className="group relative ml-2">
          <button className="flex items-center gap-2.5 glass-btn p-1.5 pl-4 rounded-full hover:bg-[var(--bg-glass-light)] transition-all cursor-pointer border border-[var(--border-subtle)]">
            <div className="flex-col items-end hidden sm:flex text-right">
              <span className="text-[13px] font-bold text-[var(--text-primary)] leading-tight">{user?.lastName} {user?.firstName}</span>
              <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mt-0.5">{roleLabel}</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-bold text-sm overflow-hidden shadow-sm shrink-0">
              {user?.avatar ? (
                <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                user?.firstName?.charAt(0) || 'U'
              )}
            </div>
            <ChevronDown className="w-4 h-4 text-[var(--text-secondary)] transition-transform duration-200 group-hover:rotate-180" />
          </button>

          {/* Menu xổ xuống — pt-3 làm "cầu" giữ hover khi rê xuống */}
          <div className="absolute right-0 top-full pt-3 w-64 opacity-0 invisible translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 transition-all duration-200 z-50">
            <div className="bg-[var(--bg-glass-heavy)] backdrop-blur-xl border border-[var(--border-glass)] rounded-[16px] shadow-[0_16px_40px_rgba(0,0,0,0.15)] overflow-hidden">
              <div className="p-5 border-b border-[var(--border-subtle)] bg-[var(--bg-glass-light)] flex flex-col gap-1.5">
                <p className="text-[15px] font-bold text-[var(--text-primary)] truncate">{user?.lastName} {user?.firstName}</p>
                <p className="text-[13px] text-[var(--text-secondary)] truncate">{user?.email}</p>
                <div className="mt-1 flex">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                    {roleLabel}
                  </span>
                </div>
              </div>
              <div className="p-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-[10px] transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" /> Đăng xuất
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
