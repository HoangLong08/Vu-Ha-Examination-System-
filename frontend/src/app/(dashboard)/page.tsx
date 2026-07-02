import { ClipboardList } from 'lucide-react';
import { ExamList } from './ExamList';
import { StudentProfile } from './StudentProfile';

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto">
      {/* Thông tin Sinh Viên (tên thật + các trường giả lập theo tài khoản) */}
      <StudentProfile />

      {/* Bài thi sắp tới */}
      <section>
        <h2 className="text-lg font-bold text-[var(--text-primary)] mb-5 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600"><ClipboardList className="w-[18px] h-[18px]" /></span>
          Danh sách bài thi của bạn
        </h2>

        <ExamList />
      </section>
    </div>
  );
}
