'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { BrandLogo } from '@/components/ui/BrandLogo';
import {
  LayoutDashboard,
  CalendarClock,
  BarChart3,
  FileText,
  LogOut,
  Users,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  PieChart,
  SquarePen,
} from 'lucide-react';

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ isCollapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, logout } = useAuth();
  const router = useRouter();

  // Active = trùng path; nếu href có ?tab= thì khớp thêm tab hiện tại
  // (usePathname KHÔNG kèm query nên phải so riêng). Tab mặc định = 'overview'.
  const isNavActive = (href: string): boolean => {
    const [path, query] = href.split('?');
    if (path !== pathname) return false;
    if (!query) return true;
    const target = new URLSearchParams(query).get('tab');
    const current = searchParams.get('tab') ?? 'overview';
    return target === current;
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const isInvigilator = user?.roles.includes('INVIGILATOR');
  const isExaminer =
    user?.roles.includes('EXAM_OFFICER') || user?.roles.includes('ADMIN');
  const isStudent = !isInvigilator && !isExaminer; // default fallback

  let mainNav = [];
  if (isInvigilator) {
    mainNav = [{ label: 'Phòng thi', href: '/invigilator', icon: Users }];
  } else if (isExaminer) {
    mainNav = [
      { label: 'Tổng quan', href: '/admin?tab=overview', icon: BarChart3 },
      { label: 'Quản lý Đề thi', href: '/admin?tab=exams', icon: FileText },
      { label: 'Lịch thi', href: '/admin?tab=schedules', icon: CalendarClock },
      { label: 'Bài làm', href: '/admin?tab=submissions', icon: ClipboardList },
      { label: 'Báo cáo', href: '/admin?tab=reports', icon: PieChart },
      { label: 'Chấm tự luận', href: '/admin?tab=essays', icon: SquarePen },
    ];
  } else {
    mainNav = [
      { label: 'Dashboard', href: '/', icon: LayoutDashboard },
      { label: 'Lịch thi', href: '/schedule', icon: CalendarClock, badge: 3 },
      { label: 'Kết quả', href: '/results', icon: BarChart3 },
      { label: 'Đề thi', href: '/exams', icon: FileText },
    ];
  }

  return (
    <aside
      className={`glass-sidebar h-screen fixed left-0 top-0 z-50 flex flex-col transition-all duration-300 ${isCollapsed ? 'w-[80px]' : 'w-[260px]'}`}
    >
      {/* Toggle Button */}
      {onToggle && (
        <button
          onClick={onToggle}
          className="absolute -right-3.5 top-7 bg-brand-600 text-white p-1 rounded-full shadow-md hover:bg-brand-700 transition-colors z-50"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      )}

      {/* Brand */}
      <div
        className={`py-5 flex items-center border-b border-[var(--border-subtle)] transition-all ${isCollapsed ? 'px-0 justify-center' : 'px-5 gap-3'}`}
      >
        <BrandLogo size={42} bare />
        {!isCollapsed && (
          <div className="animate-[fade-in_0.3s_ease]">
            <h2 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">
              DAU Exam
            </h2>
            <p className="text-[11px] text-[var(--text-secondary)] font-medium uppercase tracking-wider">
              Hệ thống trắc nghiệm
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden">
        {!isCollapsed && (
          <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider px-6 pt-4 pb-2">
            Chính
          </p>
        )}
        <div className="px-3 flex flex-col gap-0.5 mt-2">
          {mainNav.map((item) => {
            const isActive = isNavActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center rounded-xl text-sm font-medium transition-all duration-200 ${
                  isCollapsed ? 'justify-center p-3' : 'gap-3 px-3.5 py-2.5'
                } ${
                  isActive
                    ? 'bg-[var(--nav-active-bg)] text-brand-600 dark:text-blue-400 font-semibold'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--nav-hover-bg)] hover:text-[var(--text-primary)]'
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
                {!isCollapsed && item.badge && (
                  <span className="ml-auto bg-gradient-to-br from-brand-600 to-brand-700 text-white text-[11px] font-bold px-2 py-0.5 rounded-[10px] min-w-[22px] text-center shrink-0">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* System Info Footer */}
      {!isCollapsed && (
        <div className="p-4 mt-auto border-t border-[var(--border-subtle)] bg-[var(--bg-glass)] animate-[fade-in_0.3s_ease]">
          <div className="flex flex-col items-center justify-center opacity-70 hover:opacity-100 transition-opacity">
            <p className="text-[11px] font-semibold text-[var(--text-secondary)]">
              Phiên bản 1.0.0
            </p>
            <p className="text-[10px] font-bold text-brand-500 mt-0.5 tracking-widest uppercase">
              Powered by CAIRA
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}
