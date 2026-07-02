import type { Metadata } from 'next';
import './globals.css';
import 'katex/dist/katex.min.css';

export const metadata: Metadata = {
  title: 'DAU Exam — Hệ thống thi trực tuyến',
  description: 'Hệ thống thi trực tuyến Đại học Kiến trúc Đà Nẵng',
};

import { AuthProvider } from '@/context/AuthContext';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <AuthProvider>
          {/* Gradient Mesh Background */}
          <div className="gradient-mesh">
            <div className="orb orb-1" />
            <div className="orb orb-2" />
            <div className="orb orb-3" />
          </div>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
