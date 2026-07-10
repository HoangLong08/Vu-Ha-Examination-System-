'use client';

import { useState, useEffect, useCallback } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import {
  Users,
  Clock,
  AlertCircle,
  CheckCircle2,
  Monitor,
  MoreVertical,
  KeyRound,
  Power,
  Server,
  Search,
  Filter,
  ArrowLeft,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { ResetSessionModal } from '@/components/invigilator/ResetSessionModal';
import { ResetPasswordModal } from '@/components/invigilator/ResetPasswordModal';
import {
  getInvigilatorSessions,
  getInvigilatorStudents,
  resetStudentPassword,
  resetStudentSession,
  type InvigStudent,
} from '@/services/api';
import { normalizeSearchText } from '@/lib/searchText';

interface StudentStatus {
  id: string;
  name: string;
  studentId: string;
  phone: string;
  status: 'OFFLINE' | 'READY' | 'IN_PROGRESS' | 'SUBMITTED';
  violationCount: number;
  machineId?: string;
  ipAddress?: string;
  progress?: { completed: number; total: number };
  score?: number | null;
  timeRemaining?: string; // "MM:SS" (ảnh chụp lúc tải)
  remainingSeconds?: number | null; // để đếm ngược LIVE phía giám thị
}

interface Room {
  id: string;
  name: string;
  examName: string;
  totalStudents: number;
  examDate: string;
  shift: number;
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED';
}

/** giây -> "MM:SS" (— nếu null). */
function fmtTime(sec: number | null): string | undefined {
  if (sec == null) return undefined;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** "yyyy-mm-dd" -> "dd/mm/yyyy" CHỈ để hiển thị (so sánh/lọc vẫn dùng yyyy-mm-dd). */
function fmtDateDisplay(isoDate: string): string {
  const [y, m, d] = isoDate.split('-');
  return y && m && d ? `${d}/${m}/${y}` : isoDate;
}

/**
 * So khớp bộ lọc ngày với ngày phòng thi — CHỈ so sánh phần yyyy-mm-dd, không
 * so sánh timestamp/Date đầy đủ (tránh lệch múi giờ) và không so chuỗi hiển thị.
 */
export function matchesExamDate(
  roomExamDate: string,
  filterDate: string,
): boolean {
  if (filterDate === 'all') return true;
  return roomExamDate.slice(0, 10) === filterDate;
}

/** Map sinh viên thật (API) -> shape hiển thị của bảng. */
function mapStudent(s: InvigStudent): StudentStatus {
  const status: StudentStatus['status'] =
    s.status === 'IN_PROGRESS'
      ? 'IN_PROGRESS'
      : s.status === 'NOT_STARTED'
        ? 'OFFLINE' // chưa đăng nhập/chưa vào thi
        : 'SUBMITTED';
  return {
    id: s.id,
    name: s.fullName,
    studentId: s.studentCode,
    phone: s.phone ?? '',
    status,
    violationCount: 0,
    machineId: s.machineId,
    ipAddress: s.ipAddress ?? undefined,
    progress: { completed: s.answered, total: s.total },
    score: s.score,
    timeRemaining: fmtTime(s.remainingSeconds),
    remainingSeconds: s.remainingSeconds,
  };
}

type SortKey =
  'machineId' | 'name' | 'studentId' | 'status' | 'progress' | 'score';

/** Header cột có sắp xếp (click để đổi cột/chiều). */
function SortTh({
  k,
  label,
  sortKey,
  sortAsc,
  onSort,
}: {
  k: SortKey;
  label: string;
  sortKey: SortKey;
  sortAsc: boolean;
  onSort: (k: SortKey) => void;
}) {
  return (
    <button
      onClick={() => onSort(k)}
      className="inline-flex items-center gap-1 uppercase tracking-wider hover:text-brand-600 transition-colors"
    >
      {label}
      {sortKey === k ? (
        sortAsc ? (
          <ChevronUp className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3" />
        )
      ) : (
        <ArrowUpDown className="w-3 h-3 opacity-50" />
      )}
    </button>
  );
}

export default function InvigilatorPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [students, setStudents] = useState<StudentStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Action Modals State
  const [resetSessionStudent, setResetSessionStudent] =
    useState<StudentStatus | null>(null);
  const [resetPasswordStudent, setResetPasswordStudent] =
    useState<StudentStatus | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Filter State
  const [filterDate, setFilterDate] = useState('all');
  const [filterShift, setFilterShift] = useState('all');
  const [filterSubject, setFilterSubject] = useState('');

  // Tìm kiếm + lọc trạng thái nộp + sắp xếp trong bảng sinh viên (màn chi tiết).
  const [studentQuery, setStudentQuery] = useState('');
  const [submitFilter, setSubmitFilter] = useState<'all' | 'submitted' | 'not'>(
    'all',
  );
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 30;
  // Về trang 1 khi đổi phòng / tìm kiếm / lọc.
  useEffect(() => {
    setPage(1);
  }, [selectedRoom, studentQuery, submitFilter]);
  const [sortKey, setSortKey] = useState<SortKey>('machineId');
  const [sortAsc, setSortAsc] = useState(true);
  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  // Đếm ngược LIVE: mốc thời gian lúc tải danh sách + đồng hồ "now" nhịp 1s.
  const [fetchedAt, setFetchedAt] = useState(() => Date.now());
  const [nowTs, setNowTs] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const sessions = await getInvigilatorSessions();
        if (!active) return;
        setRooms(
          sessions.map((s) => ({
            id: s.id,
            name: `Đề ${s.code}`,
            examName: s.title,
            totalStudents: s.totalStudents,
            // yyyy-mm-dd từ backend — cắt phòng khi backend lỡ trả kèm giờ/timezone.
            examDate: (s.examDate || '').slice(0, 10),
            shift: 1,
            status: s.status,
          })),
        );
      } catch {
        if (active) setRooms([]);
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClick = () => setOpenDropdownId(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const loadStudents = useCallback(async (roomId: string) => {
    try {
      const list = await getInvigilatorStudents(roomId);
      setStudents(list.map(mapStudent));
      setFetchedAt(Date.now()); // mốc để đếm ngược từ remainingSeconds
    } catch {
      setStudents([]);
    }
  }, []);

  const handleSelectRoom = (roomId: string) => {
    setSelectedRoom(roomId);
    setStudents([]);
    void loadStudents(roomId);
  };

  // Tự đồng bộ lại danh sách phòng đang xem mỗi 20s (cập nhật người vào/nộp mới).
  useEffect(() => {
    if (!selectedRoom) return;
    const id = setInterval(() => void loadStudents(selectedRoom), 20000);
    return () => clearInterval(id);
  }, [selectedRoom, loadStudents]);

  // Giờ còn lại đếm ngược LIVE từ mốc tải (chỉ với SV đang làm bài).
  const liveTime = (s: StudentStatus): string | null => {
    if (s.status !== 'IN_PROGRESS' || s.remainingSeconds == null) return null;
    const left = Math.max(
      0,
      s.remainingSeconds - Math.floor((nowTs - fetchedAt) / 1000),
    );
    const m = Math.floor(left / 60);
    const sec = left % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const getStatusBadge = (status: StudentStatus['status']) => {
    switch (status) {
      case 'OFFLINE':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300">
            Chưa đăng nhập
          </span>
        );
      case 'READY':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
            Đã sẵn sàng
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 flex items-center gap-1 w-fit">
            <Monitor className="w-3 h-3" /> Đang làm bài
          </span>
        );
      case 'SUBMITTED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 flex items-center gap-1 w-fit">
            <CheckCircle2 className="w-3 h-3" /> Đã nộp bài
          </span>
        );
    }
  };

  const renderProgressBar = (
    progress?: { completed: number; total: number },
    status?: string,
  ) => {
    if (!progress || status === 'OFFLINE')
      return <span className="text-xs text-[var(--text-muted)]">-</span>;
    const percent = Math.round((progress.completed / progress.total) * 100);
    const isSubmitted = status === 'SUBMITTED';

    return (
      <div className="flex flex-col gap-1 w-24">
        <div className="flex justify-between text-[10px] font-bold">
          <span className={isSubmitted ? 'text-emerald-600' : 'text-brand-600'}>
            {progress.completed}/{progress.total}
          </span>
          <span className="text-[var(--text-muted)]">{percent}%</span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${isSubmitted ? 'bg-emerald-500' : 'bg-gradient-to-r from-brand-500 to-brand-600'}`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="animate-pulse flex flex-col gap-4">
        <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
      </div>
    );
  }

  // Filter Logic — so sánh CHỈ theo yyyy-mm-dd (bỏ giờ/timezone), không so
  // với chuỗi hiển thị đã định dạng (dd/mm/yyyy) để tránh lệch múi giờ/định dạng.
  const hasActiveFilters =
    filterDate !== 'all' ||
    filterShift !== 'all' ||
    (filterSubject !== 'all' && filterSubject !== '');
  const clearFilters = () => {
    setFilterDate('all');
    setFilterShift('all');
    setFilterSubject('all');
  };
  const filteredRooms = rooms.filter((r) => {
    if (!matchesExamDate(r.examDate, filterDate)) return false;
    if (filterShift !== 'all' && r.shift.toString() !== filterShift)
      return false;
    if (
      filterSubject !== 'all' &&
      filterSubject !== '' &&
      r.examName !== filterSubject
    )
      return false;
    return true;
  });

  const selectedRoomData = rooms.find((r) => r.id === selectedRoom);

  // Lọc theo ô tìm kiếm (tên / mã SV / SĐT) + sắp xếp theo cột đang chọn.
  const STATUS_ORDER: Record<StudentStatus['status'], number> = {
    IN_PROGRESS: 0,
    SUBMITTED: 1,
    READY: 2,
    OFFLINE: 3,
  };
  const visibleStudents = students
    .filter((s) => {
      if (submitFilter === 'submitted' && s.status !== 'SUBMITTED')
        return false;
      if (submitFilter === 'not' && s.status === 'SUBMITTED') return false;
      const q = normalizeSearchText(studentQuery);
      if (!q) return true;
      return (
        normalizeSearchText(s.name).includes(q) ||
        normalizeSearchText(s.studentId).includes(q) ||
        normalizeSearchText(s.phone).includes(q) ||
        normalizeSearchText(s.machineId).includes(q) ||
        normalizeSearchText(s.ipAddress).includes(q)
      );
    })
    .slice()
    .sort((a, b) => {
      let r = 0;
      switch (sortKey) {
        case 'name':
          r = a.name.localeCompare(b.name);
          break;
        case 'studentId':
          r = a.studentId.localeCompare(b.studentId);
          break;
        case 'status':
          r = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
          break;
        case 'progress':
          r = (a.progress?.completed ?? 0) - (b.progress?.completed ?? 0);
          break;
        case 'score':
          r = (a.score ?? -1) - (b.score ?? -1);
          break;
        default:
          r = (a.machineId ?? '').localeCompare(b.machineId ?? '');
      }
      return sortAsc ? r : -r;
    });

  const pageCount = Math.max(1, Math.ceil(visibleStudents.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pagedStudents = visibleStudents.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const uniqueDates = Array.from(new Set(rooms.map((r) => r.examDate)));
  const uniqueShifts = Array.from(new Set(rooms.map((r) => r.shift))).sort(
    (a, b) => a - b,
  );
  const uniqueSubjects = Array.from(new Set(rooms.map((r) => r.examName)));

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Filter Bar — chỉ hiện ở danh sách (ẩn khi xem chi tiết phòng) */}
      {!selectedRoom && (
        <>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 text-[var(--text-primary)]">
              <Filter className="w-5 h-5 text-brand-500" />
              <h2 className="text-xl font-bold">Bộ lọc Phòng thi</h2>
            </div>
            <GlassCard className="p-4 flex flex-col md:flex-row gap-4 items-end bg-[var(--bg-glass)] shadow-sm">
              <div className="flex-1 flex flex-col gap-1.5 w-full">
                <label className="text-[13px] font-bold text-[var(--text-secondary)]">
                  Ngày thi
                </label>
                <input
                  type="date"
                  value={filterDate === 'all' ? '' : filterDate}
                  onChange={(e) => setFilterDate(e.target.value || 'all')}
                  className="px-4 py-[9px] rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-glass-light)] text-[14px] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand-500 w-full transition-colors"
                />
              </div>

              <div className="flex-1 flex flex-col gap-1.5 w-full">
                <label className="text-[13px] font-bold text-[var(--text-secondary)]">
                  Ca / Tiết thi
                </label>
                <select
                  value={filterShift}
                  onChange={(e) => setFilterShift(e.target.value)}
                  className="px-4 py-[9px] rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-glass-light)] text-[14px] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand-500 w-full transition-colors appearance-none"
                >
                  <option value="all">Tất cả các ca</option>
                  {uniqueShifts.map((s) => (
                    <option key={s} value={s.toString()}>
                      Ca {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-[2] flex flex-col gap-1.5 w-full">
                <label className="text-[13px] font-bold text-[var(--text-secondary)]">
                  Tên môn thi / Mã học phần
                </label>
                <select
                  value={filterSubject}
                  onChange={(e) => setFilterSubject(e.target.value)}
                  className="px-4 py-[9px] rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-glass-light)] text-[14px] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand-500 w-full transition-colors appearance-none"
                >
                  <option value="all">Tất cả môn thi</option>
                  {uniqueSubjects.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>
            </GlassCard>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredRooms.map((room) => (
              <GlassCard
                key={room.id}
                className={`cursor-pointer transition-all duration-300 hover:-translate-y-1 ${selectedRoom === room.id ? 'ring-2 ring-brand-500 shadow-lg' : ''}`}
                onClick={() => handleSelectRoom(room.id)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                    <Users className="w-5 h-5" />
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      room.status === 'ONGOING'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                        : room.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-700/40 dark:text-slate-300'
                    }`}
                  >
                    {room.status === 'ONGOING'
                      ? 'Đang diễn ra'
                      : room.status === 'COMPLETED'
                        ? 'Đã hoàn thành'
                        : 'Sắp diễn ra'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">
                  {room.name}
                </h3>
                <p className="text-sm font-medium text-[var(--text-secondary)] mb-3">
                  {room.examName}
                </p>
                <div className="flex items-center justify-between text-xs text-[var(--text-muted)] border-t border-[var(--border-subtle)] pt-3">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> {room.totalStudents} SV
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-brand-600 dark:text-blue-400">
                    Ca {room.shift}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />{' '}
                    {room.examDate ? fmtDateDisplay(room.examDate) : '—'}
                  </span>
                </div>
              </GlassCard>
            ))}
            {filteredRooms.length === 0 && (
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-[var(--text-muted)] bg-[var(--bg-glass-light)] rounded-[20px] border border-dashed border-[var(--border-subtle)]">
                <Search className="w-10 h-10 mb-3 opacity-20" />
                <p className="font-medium">
                  {hasActiveFilters
                    ? 'Không có phòng thi nào phù hợp với bộ lọc đang chọn.'
                    : 'Chưa có phòng thi nào.'}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="mt-4 px-4 py-2 rounded-lg text-[13px] font-semibold bg-[var(--bg-glass)] border border-[var(--border-subtle)] text-brand-600 hover:border-brand-500 transition-colors"
                  >
                    Xóa bộ lọc
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {selectedRoom && (
        <div className="flex flex-col gap-5">
          <button
            onClick={() => {
              setSelectedRoom(null);
              setStudents([]);
            }}
            className="inline-flex items-center gap-2 text-[14px] font-semibold text-[var(--text-secondary)] hover:text-brand-600 transition-colors w-fit"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại danh sách phòng thi
          </button>
          {selectedRoomData && (
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                  {selectedRoomData.name}
                </h2>
                <p className="text-[14px] text-[var(--text-secondary)] mt-0.5">
                  {selectedRoomData.examName} · Ca {selectedRoomData.shift} ·{' '}
                  {selectedRoomData.totalStudents} SV
                </p>
              </div>
            </div>
          )}
          <GlassCard className="p-0 overflow-hidden">
            <div className="p-5 border-b border-[var(--border-subtle)] bg-[var(--bg-glass-light)] flex flex-col gap-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">
                  Danh sách Sinh viên
                </h3>
                <div className="flex gap-4 text-sm font-medium">
                  <div className="flex items-center gap-2 text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" /> Đã nộp:{' '}
                    {students.filter((s) => s.status === 'SUBMITTED').length}
                  </div>
                  <div className="flex items-center gap-2 text-amber-600">
                    <Monitor className="w-4 h-4" /> Đang thi:{' '}
                    {students.filter((s) => s.status === 'IN_PROGRESS').length}
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative max-w-md w-full">
                  <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={studentQuery}
                    onChange={(e) => setStudentQuery(e.target.value)}
                    placeholder="Tìm theo tên (có/không dấu), mã SV, SĐT hoặc máy/IP…"
                    className="w-full pl-9 pr-3 py-2 rounded-lg text-[13px] bg-[var(--bg-glass)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                  />
                </div>
                <select
                  aria-label="Lọc theo trạng thái nộp bài"
                  value={submitFilter}
                  onChange={(e) =>
                    setSubmitFilter(
                      e.target.value as 'all' | 'submitted' | 'not',
                    )
                  }
                  className="px-3 py-2 rounded-lg text-[13px] bg-[var(--bg-glass)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand-500/40 appearance-none shrink-0"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="submitted">Đã nộp bài</option>
                  <option value="not">Chưa nộp bài</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto min-h-[300px]">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-[var(--bg-glass)] border-b border-[var(--border-subtle)] text-[12px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    <th className="p-4 pl-6">
                      <SortTh
                        k="machineId"
                        label="Máy / IP"
                        sortKey={sortKey}
                        sortAsc={sortAsc}
                        onSort={toggleSort}
                      />
                    </th>
                    <th className="p-4">
                      <SortTh
                        k="name"
                        label="Thông tin Sinh viên"
                        sortKey={sortKey}
                        sortAsc={sortAsc}
                        onSort={toggleSort}
                      />
                    </th>
                    <th className="p-4">
                      <SortTh
                        k="status"
                        label="Trạng thái"
                        sortKey={sortKey}
                        sortAsc={sortAsc}
                        onSort={toggleSort}
                      />
                    </th>
                    <th className="p-4">
                      <SortTh
                        k="progress"
                        label="Tiến độ"
                        sortKey={sortKey}
                        sortAsc={sortAsc}
                        onSort={toggleSort}
                      />
                    </th>
                    <th className="p-4">
                      <SortTh
                        k="score"
                        label="Điểm"
                        sortKey={sortKey}
                        sortAsc={sortAsc}
                        onSort={toggleSort}
                      />
                    </th>
                    <th className="p-4">Thời gian</th>
                    <th className="p-4 text-center">Cảnh báo</th>
                    <th className="p-4 pr-6 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)] text-[13px]">
                  {pagedStudents.map((student) => (
                    <tr
                      key={student.id}
                      className="hover:bg-[var(--bg-glass-light)] transition-colors group"
                    >
                      <td className="p-4 pl-6">
                        {student.machineId ? (
                          <div className="flex flex-col">
                            <span className="text-[13px] font-semibold text-brand-600 dark:text-blue-400 flex items-center gap-1.5">
                              <Server className="w-3.5 h-3.5 text-brand-500" />{' '}
                              {student.machineId}
                            </span>
                            <span className="text-[11px] font-mono text-[var(--text-muted)] mt-0.5">
                              {student.ipAddress}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-[var(--text-muted)] italic">
                            Chưa kết nối
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="text-[13px] font-medium text-[var(--text-primary)]">
                            {student.name}
                          </span>
                          <span className="text-xs text-[var(--text-secondary)]">
                            {student.studentId}
                          </span>
                          <span className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5">
                            {student.phone}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">{getStatusBadge(student.status)}</td>
                      <td className="p-4">
                        {renderProgressBar(student.progress, student.status)}
                      </td>
                      <td className="p-4">
                        {student.status === 'SUBMITTED' &&
                        student.score != null ? (
                          <span className="text-[14px] font-bold text-emerald-600">
                            {student.score.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-xs text-[var(--text-muted)]">
                            -
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        {liveTime(student) &&
                        student.status === 'IN_PROGRESS' ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--bg-glass-heavy)] border border-[var(--border-subtle)] text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
                            <Clock className="w-3 h-3" /> {liveTime(student)}
                          </div>
                        ) : student.status === 'SUBMITTED' ? (
                          <span className="text-xs font-bold text-emerald-600">
                            --:--
                          </span>
                        ) : (
                          <span className="text-xs text-[var(--text-muted)]">
                            -
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {student.violationCount > 0 ? (
                          <span className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
                            <AlertCircle className="w-3 h-3" />{' '}
                            {student.violationCount}
                          </span>
                        ) : (
                          <span className="text-xs text-[var(--text-muted)]">
                            -
                          </span>
                        )}
                      </td>
                      <td className="p-4 pr-6 text-right relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdownId(
                              openDropdownId === student.id ? null : student.id,
                            );
                          }}
                          className="p-1.5 rounded-lg hover:bg-[var(--bg-glass-heavy)] text-[var(--text-secondary)] transition-colors"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>

                        {openDropdownId === student.id && (
                          <div
                            className="absolute right-8 top-10 w-48 bg-[var(--bg-glass-heavy)] border border-[var(--border-subtle)] shadow-xl rounded-xl overflow-hidden z-20 animate-[page-enter_100ms_ease-out]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              className="w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--bg-glass)] text-[var(--text-primary)] flex items-center gap-2 transition-colors"
                              onClick={() => {
                                setResetPasswordStudent(student);
                                setOpenDropdownId(null);
                              }}
                            >
                              <KeyRound className="w-4 h-4 text-amber-500" />{' '}
                              Cấp lại mật khẩu
                            </button>
                            <button
                              className="w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--bg-glass)] text-rose-600 dark:text-rose-400 flex items-center gap-2 transition-colors border-t border-[var(--border-subtle)]"
                              onClick={() => {
                                setResetSessionStudent(student);
                                setOpenDropdownId(null);
                              }}
                            >
                              <Power className="w-4 h-4" /> Khôi phục phiên
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {visibleStudents.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="p-8 text-center text-[var(--text-secondary)]"
                      >
                        {students.length === 0 ? (
                          'Không có sinh viên nào.'
                        ) : (
                          <div className="flex flex-col items-center gap-3">
                            <span>
                              Không tìm thấy sinh viên khớp
                              {studentQuery.trim()
                                ? ` "${studentQuery.trim()}"`
                                : ' bộ lọc đang chọn'}
                              .
                            </span>
                            <button
                              onClick={() => {
                                setStudentQuery('');
                                setSubmitFilter('all');
                              }}
                              className="px-4 py-2 rounded-lg text-[13px] font-semibold bg-[var(--bg-glass)] border border-[var(--border-subtle)] text-brand-600 hover:border-brand-500 transition-colors"
                            >
                              Xóa bộ lọc
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {visibleStudents.length > PAGE_SIZE && (
              <div className="p-4 border-t border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-glass-light)] text-[13px]">
                <span className="text-[var(--text-secondary)]">
                  Hiển thị{' '}
                  <b className="text-[var(--text-primary)]">
                    {(safePage - 1) * PAGE_SIZE + 1}–
                    {Math.min(safePage * PAGE_SIZE, visibleStudents.length)}
                  </b>{' '}
                  / {visibleStudents.length} sinh viên
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-brand-600 hover:border-brand-500 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-[var(--text-secondary)] disabled:hover:border-[var(--border-subtle)] transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Trước
                  </button>
                  <span className="text-[var(--text-secondary)] font-medium px-1">
                    Trang {safePage}/{pageCount}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                    disabled={safePage === pageCount}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-brand-600 hover:border-brand-500 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-[var(--text-secondary)] disabled:hover:border-[var(--border-subtle)] transition-colors"
                  >
                    Sau <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                  </button>
                </div>
              </div>
            )}
          </GlassCard>
        </div>
      )}

      {/* Modals */}
      {resetSessionStudent && selectedRoom && (
        <ResetSessionModal
          isOpen={true}
          onClose={() => setResetSessionStudent(null)}
          onConfirm={async () => {
            const code = resetSessionStudent.studentId;
            try {
              await resetStudentSession(selectedRoom, code);
            } catch {
              /* lỗi mạng: vẫn đóng, giám thị thử lại */
            }
            setResetSessionStudent(null);
            void loadStudents(selectedRoom);
          }}
          studentName={resetSessionStudent.name}
          studentId={resetSessionStudent.studentId}
        />
      )}

      {resetPasswordStudent && selectedRoom && (
        <ResetPasswordModal
          isOpen={true}
          onClose={() => setResetPasswordStudent(null)}
          studentName={resetPasswordStudent.name}
          studentId={resetPasswordStudent.studentId}
          onGenerate={() =>
            resetStudentPassword(
              selectedRoom,
              resetPasswordStudent.studentId,
            ).then((r) => r.newPassword)
          }
        />
      )}
    </div>
  );
}
