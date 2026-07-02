'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';

export default function InvigilatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  
  return (
    <ProtectedRoute allowedRoles={['INVIGILATOR']}>
      <DashboardLayout title="Danh sách Phòng thi" subtitle={`Giám thị: ${user?.lastName || ''} ${user?.firstName || ''}`}>
        {children}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
