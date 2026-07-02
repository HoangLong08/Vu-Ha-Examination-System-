'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

/** Trang chủ ĐÚNG theo vai trò (tránh đẩy nhầm về '/' gây lặp vô hạn). */
function roleHome(roles: string[]): string {
  if (roles.includes('INVIGILATOR')) return '/invigilator';
  if (roles.includes('EXAM_OFFICER') || roles.includes('ADMIN')) return '/admin';
  return '/';
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (allowedRoles && user) {
        const hasRole = allowedRoles.some((role) => user.roles.includes(role));
        if (!hasRole) {
          // Sai vai trò -> đưa về ĐÚNG trang chủ của vai trò (không phải luôn '/'
          // vì '/' dành cho STUDENT, sẽ gây vòng lặp với khảo thí/giám thị).
          router.push(roleHome(user.roles));
        }
      }
    }
  }, [isLoading, isAuthenticated, user, allowedRoles, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (allowedRoles && user) {
    const hasRole = allowedRoles.some((role) => user.roles.includes(role));
    if (!hasRole) {
      return null;
    }
  }

  return <>{children}</>;
}
