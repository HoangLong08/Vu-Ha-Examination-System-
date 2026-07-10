'use client';

import { StudentLayout } from '@/components/layout/StudentLayout';
import ProtectedRoute from '@/components/layout/ProtectedRoute';

export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <StudentLayout>{children}</StudentLayout>
    </ProtectedRoute>
  );
}
