'use client';

import {
  ShieldCheck,
  User,
  Lock,
  LogIn,
  Loader2,
  GraduationCap,
  Eye,
  EyeOff,
} from 'lucide-react';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useAuth } from '@/context/AuthContext';
import { devLogin, login as apiLogin } from '@/services/api';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function LoginPage() {
  const { login, isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();

  // If already authenticated, redirect to the correct dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (user.roles.includes('INVIGILATOR')) {
        router.push('/invigilator');
      } else if (
        user.roles.includes('EXAM_OFFICER') ||
        user.roles.includes('ADMIN')
      ) {
        router.push('/admin');
      } else {
        router.push('/');
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Áp phiên đăng nhập + điều hướng theo vai trò (dùng chung cho mọi luồng).
  const applySession = (
    user: Awaited<ReturnType<typeof apiLogin>>['user'],
    accessToken: string,
  ) => {
    login(
      {
        id: user.id,
        email: user.email,
        firstName: user.firstName ?? user.fullName ?? user.email,
        lastName: user.lastName ?? '',
        roles: user.roles ?? [],
      },
      accessToken,
    );
    const roles = user.roles ?? [];
    if (roles.includes('INVIGILATOR')) router.push('/invigilator');
    else if (roles.includes('EXAM_OFFICER') || roles.includes('ADMIN'))
      router.push('/admin');
    else router.push('/');
  };

  const handleMockLogin = async (role: string) => {
    const email =
      role === 'INVIGILATOR'
        ? 'invigilator@yopmail.com'
        : role === 'EXAM_OFFICER'
          ? 'examofficer@yopmail.com'
          : 'student@yopmail.com';
    try {
      const { user, accessToken } = await devLogin(email);
      applySession(user, accessToken);
    } catch (err) {
      console.error('Đăng nhập thất bại', err);
      alert('Đăng nhập thất bại — kiểm tra backend đang chạy (cổng 3001).');
    }
  };

  // Đăng nhập bằng tên đăng nhập/email tuỳ ý (dùng để tạo nhiều tài khoản test,
  // ví dụ sv001, sv002… cho danh sách phòng thi).
  const handleFormLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const id = username.trim();
    if (!id) {
      setFormError('Vui lòng nhập tên đăng nhập.');
      return;
    }
    // yêu cầu email hợp lệ → tự thêm domain nếu người dùng gõ tên ngắn.
    const email = id.includes('@') ? id : `${id}@dau.edu.vn`;
    setFormError(null);
    setSubmitting(true);
    try {
      const { user, accessToken } = await apiLogin(email, password || 'demo');
      applySession(user, accessToken);
    } catch {
      setFormError(
        'Đăng nhập thất bại — kiểm tra backend đang chạy (cổng 3001).',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center overflow-hidden relative">
      {/* Extra Orbs for Login */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div
          className="absolute w-[400px] h-[400px] rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%)',
            top: '40%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            filter: 'blur(80px)',
            animation: 'float3 18s ease-in-out infinite',
          }}
        />
        <div
          className="absolute w-[300px] h-[300px] rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(251,191,36,0.08) 0%, transparent 70%)',
            top: '10%',
            left: '20%',
            filter: 'blur(80px)',
            animation: 'float1 25s ease-in-out infinite reverse',
          }}
        />
      </div>

      {/* Theme Toggle */}
      <div className="fixed top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Login Card */}
      <div className="relative z-10 flex flex-col items-center page-enter w-full max-w-[560px] px-4">
        <div className="glass-heavy px-10 py-10 w-full text-center rounded-3xl transition-shadow duration-300 hover:shadow-[var(--glass-shadow),0_16px_48px_rgba(31,38,135,0.08)]">
          {/* Logo */}
          <div className="flex flex-col items-center mb-1">
            <BrandLogo size={84} bare className="mb-4" />
            <h1 className="text-[28px] font-bold tracking-tight bg-gradient-to-br from-brand-600 to-brand-700 bg-clip-text text-transparent dark:from-blue-400 dark:to-blue-300">
              DAU Exam
            </h1>
            <p className="text-[15px] text-[var(--text-secondary)] mt-1">
              Hệ thống thi trực tuyến
            </p>
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-gradient-to-r from-transparent via-[var(--border-subtle)] to-transparent my-6" />

          {/* Form đăng nhập (tên đăng nhập + mật khẩu) — tạo nhiều tài khoản test */}
          <form
            onSubmit={handleFormLogin}
            className="flex flex-col gap-3 text-left"
          >
            <div className="relative">
              <User className="w-[18px] h-[18px] text-[var(--text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                aria-label="Tên đăng nhập"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Tên đăng nhập"
                className="w-full pl-11 pr-4 py-4 rounded-[14px] border border-slate-300 bg-slate-100 dark:border-[var(--border-glass)] dark:bg-[var(--bg-glass)] text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-brand-500/40 transition-colors"
              />
            </div>
            <div className="relative">
              <Lock className="w-[18px] h-[18px] text-[var(--text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                aria-label="Mật khẩu"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mật khẩu"
                className="w-full pl-11 pr-11 py-4 rounded-[14px] border border-slate-300 bg-slate-100 dark:border-[var(--border-glass)] dark:bg-[var(--bg-glass)] text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-brand-500/40 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-glass-light)] transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-[18px] h-[18px]" />
                ) : (
                  <Eye className="w-[18px] h-[18px]" />
                )}
              </button>
            </div>
            {formError && (
              <p className="text-[13px] font-medium text-rose-600">
                {formError}
              </p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center justify-center gap-2 px-6 py-4 rounded-[14px] bg-gradient-to-r from-brand-600 to-brand-700 text-white font-semibold text-[15px] shadow-lg shadow-brand-500/30 hover:shadow-brand-500/40 transition-all disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="w-[18px] h-[18px] animate-spin" />
              ) : (
                <LogIn className="w-[18px] h-[18px]" />
              )}
              Đăng nhập
            </button>
          </form>

          {/* Divider phụ */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[var(--border-subtle)]" />
            <span className="text-[12px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">
              Hoặc đăng nhập nhanh
            </span>
            <div className="flex-1 h-px bg-[var(--border-subtle)]" />
          </div>

          {/* Đăng nhập nhanh (demo) — 3 vai trò gọn trên MỘT hàng */}
          <div className="grid grid-cols-3 gap-2.5">
            {/* Sinh viên */}
            <button
              onClick={() => handleMockLogin('STUDENT')}
              title="Đăng nhập nhanh Sinh viên (demo)"
              className="flex flex-col items-center justify-center gap-1.5 px-2 py-3 rounded-[12px] border border-[var(--border-glass)] bg-[var(--bg-glass)] backdrop-blur-[12px] text-[12px] font-semibold text-[var(--text-primary)] cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(37,99,235,0.12)] hover:border-[rgba(37,99,235,0.25)]"
            >
              <GraduationCap className="w-[22px] h-[22px] flex-shrink-0 text-brand-600 dark:text-blue-400" />
              Sinh viên
            </button>

            {/* Giám thị */}
            <button
              onClick={() => handleMockLogin('INVIGILATOR')}
              title="Đăng nhập nhanh Giám thị (demo)"
              className="flex flex-col items-center justify-center gap-1.5 px-2 py-3 rounded-[12px] border border-[var(--border-glass)] bg-[var(--bg-glass)] backdrop-blur-[12px] text-[12px] font-semibold text-[var(--text-primary)] cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(217,119,6,0.12)] hover:border-[rgba(217,119,6,0.25)]"
            >
              <Eye className="w-[22px] h-[22px] flex-shrink-0 text-amber-500" />
              Giám thị
            </button>

            {/* Khảo thí */}
            <button
              onClick={() => handleMockLogin('EXAM_OFFICER')}
              title="Đăng nhập nhanh Khảo thí (demo)"
              className="flex flex-col items-center justify-center gap-1.5 px-2 py-3 rounded-[12px] border border-[var(--border-glass)] bg-[var(--bg-glass)] backdrop-blur-[12px] text-[12px] font-semibold text-[var(--text-primary)] cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(139,92,246,0.12)] hover:border-[rgba(139,92,246,0.25)]"
            >
              <ShieldCheck className="w-[22px] h-[22px] flex-shrink-0 text-purple-500" />
              Khảo thí
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-[13px] text-[var(--text-secondary)] leading-relaxed">
          <strong className="text-[var(--text-primary)] font-semibold">
            Trường Đại học Kiến trúc Đà Nẵng
          </strong>
          <br />
          <span>566 Núi Thành, Hải Châu, Đà Nẵng</span>
        </div>
      </div>
    </div>
  );
}
