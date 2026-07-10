'use client';

import { useEffect, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import {
  Database,
  FileText,
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  Eye,
  EyeOff,
  Send,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Settings2,
  BarChart3,
  ClipboardList,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ReportPanel } from './ReportPanel';
import { ExamManagement } from './ExamManagement';
import { EssayGrading } from './EssayGrading';
import { SubmissionsPanel } from './SubmissionsPanel';
import { SchedulePanel } from './SchedulePanel';
import { OverviewStats } from './OverviewStats';
import {
  getExamDefinition,
  setExamConfig,
  publishResults,
  getExamCoreMatrices,
  type ExamCoreMatrix,
} from '@/services/api';

/** Đề demo CS101 dùng cho cấu hình Hiện/Ẩn kết quả (FR-L-003). */
const DEMO_EXAM_DEF_ID = '11111111-1111-4111-8111-111111111111';

type TabType =
  'overview' | 'exams' | 'schedules' | 'submissions' | 'reports' | 'essays';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

/**
 * Card "Cấu hình kỳ thi — CS101" (FR-L-003).
 *  - Toggle "Cho phép sinh viên xem điểm" → PATCH /exam-definitions/:id/config.
 *  - Nút "Công bố kết quả" → POST /exams/:id/results/publish.
 */
function ExamConfigCard() {
  const [loading, setLoading] = useState(true);
  const [showResult, setShowResult] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [configMsg, setConfigMsg] = useState<string | null>(null);
  const [publishMsg, setPublishMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Nguồn câu hỏi (EPIC-21): ma trận exam-core gắn cho đề.
  const [matrices, setMatrices] = useState<ExamCoreMatrix[]>([]);
  const [matrixId, setMatrixId] = useState<string>('');
  const [savingSource, setSavingSource] = useState(false);
  const [sourceMsg, setSourceMsg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [def, mtx] = await Promise.all([
          getExamDefinition(DEMO_EXAM_DEF_ID),
          getExamCoreMatrices().catch(() => ({ source: 'mock', items: [] })),
        ]);
        if (active) {
          setShowResult(def.showResult);
          setMatrixId(def.examCoreMatrixId ?? '');
          setMatrices(mtx.items);
        }
      } catch {
        if (active) setError('Không tải được cấu hình kỳ thi.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleToggle = async () => {
    if (saving) return;
    const next = !showResult;
    setSaving(true);
    setError(null);
    setConfigMsg(null);
    try {
      const def = await setExamConfig(DEMO_EXAM_DEF_ID, { showResult: next });
      setShowResult(def.showResult);
      setConfigMsg('Đã lưu cấu hình.');
    } catch {
      setError('Lưu cấu hình thất bại. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const handleSourceChange = async (nextMatrixId: string) => {
    if (savingSource) return;
    setSavingSource(true);
    setError(null);
    setSourceMsg(null);
    try {
      // Chuỗi rỗng => gỡ liên kết (đề về nguồn mock/bank mặc định).
      const def = await setExamConfig(DEMO_EXAM_DEF_ID, {
        examCoreMatrixId: nextMatrixId,
      });
      setMatrixId(def.examCoreMatrixId ?? '');
      setSourceMsg(
        nextMatrixId ? 'Đã gắn ma trận đề.' : 'Đã gỡ liên kết ma trận.',
      );
    } catch {
      setError('Lưu nguồn câu hỏi thất bại. Vui lòng thử lại.');
    } finally {
      setSavingSource(false);
    }
  };

  const handlePublish = async () => {
    if (publishing) return;
    setPublishing(true);
    setError(null);
    setPublishMsg(null);
    try {
      const { published } = await publishResults(DEMO_EXAM_DEF_ID);
      setPublishMsg(`Đã công bố ${published} kết quả.`);
    } catch {
      setError('Công bố kết quả thất bại. Vui lòng thử lại.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <GlassCard className="p-6 flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-500/12 text-indigo-600 dark:text-indigo-400">
          <Settings2 className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">
            Cấu hình kỳ thi — CS101
          </h2>
          <p className="text-[13px] text-[var(--text-secondary)]">
            Hiện/Ẩn kết quả cho sinh viên và công bố điểm.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm py-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Đang tải cấu hình…
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-4 p-4 rounded-[14px] bg-[var(--bg-glass)] border border-[var(--border-subtle)]">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 ${showResult ? 'bg-emerald-500/12 text-emerald-600' : 'bg-slate-500/12 text-slate-500'}`}
              >
                {showResult ? (
                  <Eye className="w-[18px] h-[18px]" />
                ) : (
                  <EyeOff className="w-[18px] h-[18px]" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-[var(--text-primary)]">
                  Cho phép sinh viên xem điểm
                </p>
                <p className="text-[12px] text-[var(--text-secondary)]">
                  {showResult
                    ? 'Sinh viên thấy điểm và đáp án sau khi nộp.'
                    : 'Sinh viên chỉ thấy thông báo hoàn thành.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={showResult}
              aria-label="Cho phép sinh viên xem điểm"
              onClick={handleToggle}
              disabled={saving}
              className={`relative shrink-0 inline-flex h-7 w-12 items-center rounded-full transition-colors disabled:opacity-60 ${showResult ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'}`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${showResult ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
          </div>

          {configMsg && (
            <p className="flex items-center gap-1.5 text-[13px] font-medium text-emerald-600">
              <CheckCircle2 className="w-4 h-4" /> {configMsg}
            </p>
          )}

          {/* Nguồn câu hỏi — chọn ma trận đề exam-core (EPIC-21) */}
          <div className="flex flex-col gap-2 p-4 rounded-[14px] bg-[var(--bg-glass)] border border-[var(--border-subtle)]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 bg-blue-500/12 text-blue-600">
                <Database className="w-[18px] h-[18px]" />
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-[var(--text-primary)]">
                  Nguồn câu hỏi (ma trận đề)
                </p>
                <p className="text-[12px] text-[var(--text-secondary)]">
                  Gắn ma trận để rút đề theo section/độ khó. Bỏ chọn = nguồn mặc
                  định.
                </p>
              </div>
            </div>
            <select
              aria-label="Chọn ma trận đề"
              value={matrixId}
              disabled={savingSource}
              onChange={(e) => handleSourceChange(e.target.value)}
              className="w-full mt-1 px-3 py-2.5 rounded-[12px] text-[14px] bg-[var(--bg-glass)] border border-[var(--border-subtle)] text-[var(--text-primary)] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            >
              <option value="">— Nguồn mặc định (mock/bank) —</option>
              {matrices.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.courseNameText})
                </option>
              ))}
            </select>
            {savingSource && (
              <p className="flex items-center gap-1.5 text-[12px] text-[var(--text-secondary)]">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang lưu…
              </p>
            )}
            {sourceMsg && (
              <p className="flex items-center gap-1.5 text-[13px] font-medium text-emerald-600">
                <CheckCircle2 className="w-4 h-4" /> {sourceMsg}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1 border-t border-[var(--border-subtle)]">
            <Button
              variant="primary"
              onClick={handlePublish}
              disabled={publishing}
              className="px-5 py-2.5 gap-2 text-sm bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30 text-white border-0"
            >
              {publishing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {publishing ? 'Đang công bố…' : 'Công bố kết quả'}
            </Button>
            {publishMsg && (
              <p className="flex items-center gap-1.5 text-[13px] font-medium text-emerald-600">
                <CheckCircle2 className="w-4 h-4" /> {publishMsg}
              </p>
            )}
          </div>
        </>
      )}

      {error && (
        <p className="flex items-center gap-1.5 text-[13px] font-medium text-rose-600">
          <AlertCircle className="w-4 h-4" /> {error}
        </p>
      )}
    </GlassCard>
  );
}

function AdminDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab = (
    [
      'overview',
      'exams',
      'schedules',
      'submissions',
      'reports',
      'essays',
    ].includes(tabParam as string)
      ? tabParam
      : 'overview'
  ) as TabType;

  const handleTabChange = (tab: TabType) => {
    router.push(`/admin?tab=${tab}`);
  };

  const renderOverview = () => (
    <div className="flex flex-col gap-6 animate-[page-enter_0.3s_ease]">
      <OverviewStats />
      <ExamConfigCard />
    </div>
  );

  const renderExams = () => <ExamManagement />;

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto">
      {/* Header and Tabs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight mb-2">
            Quản trị Khảo thí
          </h1>
          <p className="text-[var(--text-secondary)]">
            Quản lý hệ thống ngân hàng đề thi, lịch thi và theo dõi kỳ thi.
          </p>
        </div>
      </div>

      {/* Custom Tabs */}
      <div className="flex p-1 bg-[var(--bg-glass)] border border-[var(--border-glass)] backdrop-blur-md rounded-[16px] w-fit shadow-sm">
        <button
          onClick={() => handleTabChange('overview')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-[12px] text-[14px] font-bold transition-all ${
            activeTab === 'overview'
              ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-blue-400 shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-glass-light)]'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" /> Tổng quan
        </button>
        <button
          onClick={() => handleTabChange('exams')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-[12px] text-[14px] font-bold transition-all ${
            activeTab === 'exams'
              ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-blue-400 shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-glass-light)]'
          }`}
        >
          <BookOpen className="w-4 h-4" /> Ngân hàng Đề thi
        </button>
        <button
          onClick={() => handleTabChange('schedules')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-[12px] text-[14px] font-bold transition-all ${
            activeTab === 'schedules'
              ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-blue-400 shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-glass-light)]'
          }`}
        >
          <CalendarDays className="w-4 h-4" /> Lịch thi
        </button>
        <button
          onClick={() => handleTabChange('submissions')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-[12px] text-[14px] font-bold transition-all ${
            activeTab === 'submissions'
              ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-blue-400 shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-glass-light)]'
          }`}
        >
          <ClipboardList className="w-4 h-4" /> Bài làm
        </button>
        <button
          onClick={() => handleTabChange('reports')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-[12px] text-[14px] font-bold transition-all ${
            activeTab === 'reports'
              ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-blue-400 shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-glass-light)]'
          }`}
        >
          <BarChart3 className="w-4 h-4" /> Báo cáo
        </button>
        <button
          onClick={() => handleTabChange('essays')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-[12px] text-[14px] font-bold transition-all ${
            activeTab === 'essays'
              ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-blue-400 shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-glass-light)]'
          }`}
        >
          <FileText className="w-4 h-4" /> Chấm tự luận
        </button>
      </div>

      {/* Main Content Area */}
      <div className="w-full">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'exams' && renderExams()}
        {activeTab === 'schedules' && <SchedulePanel />}
        {activeTab === 'submissions' && <SubmissionsPanel />}
        {activeTab === 'reports' && <ReportPanel />}
        {activeTab === 'essays' && <EssayGrading />}
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-12 text-[var(--text-secondary)]">
          Đang tải dữ liệu...
        </div>
      }
    >
      <AdminDashboard />
    </Suspense>
  );
}
