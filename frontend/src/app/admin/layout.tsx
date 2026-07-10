'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  return (
    <ProtectedRoute allowedRoles={['EXAM_OFFICER', 'ADMIN']}>
      <DashboardLayout
        title="Quản trị Hệ thống"
        subtitle={
          `${user?.lastName || ''} ${user?.firstName || ''}`.trim() || undefined
        }
      >
        {children}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
