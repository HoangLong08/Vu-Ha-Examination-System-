'use client';

import { User } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { useAuth } from '@/context/AuthContext';
import { simulateStudent } from '@/lib/simulateStudent';

/**
 * Thẻ "Thông tin cá nhân" — lấy TÊN THẬT từ phiên đăng nhập + các trường còn lại
 * (mã SV, lớp, khoa, ngày sinh) GIẢ LẬP theo tài khoản (sinh động, giống thật).
 */
export function StudentProfile() {
  const { user } = useAuth();
  const fullName =
    `${user?.lastName ?? ''} ${user?.firstName ?? ''}`.trim() ||
    user?.email ||
    'Sinh viên';
  const s = simulateStudent(user?.email || user?.id || 'sv');
  const initial = fullName.trim().charAt(0).toUpperCase() || 'S';

  // Xếp 3 cột (row-major): hàng 1 Họ tên · Mã SV · Khoa; hàng 2 Ngày sinh (dưới
  // Họ tên) · Lớp (dưới Mã SV).
  const fields = [
    { label: 'Họ và tên', value: fullName },
    { label: 'Mã sinh viên', value: s.studentCode },
    { label: 'Khoa', value: s.faculty },
    { label: 'Ngày sinh', value: s.dob },
    { label: 'Lớp sinh hoạt', value: s.className },
  ];

  return (
    <GlassCard className="p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-brand-500/10 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none" />
      <h2 className="text-lg font-bold text-[var(--text-primary)] mb-5 flex items-center gap-2">
        <span className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-600">
          <User className="w-[18px] h-[18px]" />
        </span>
        Thông tin cá nhân
      </h2>

      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg border-4 border-[var(--bg-glass)]">
          {initial}
        </div>

        <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-8">
          {fields.map((f) => (
            <div key={f.label}>
              <p className="text-[12px] text-[var(--text-secondary)] mb-1 uppercase tracking-wider font-semibold">
                {f.label}
              </p>
              <p className="text-[15px] font-bold text-[var(--text-primary)]">
                {f.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}
