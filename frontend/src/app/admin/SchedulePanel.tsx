'use client';

import { useEffect, useState } from 'react';
import {
  Plus,
  Loader2,
  AlertCircle,
  CalendarClock,
  UserPlus,
  X,
  DoorOpen,
  CheckCircle2,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import {
  getSchedulingSessions,
  getExamRooms,
  getInvigilators,
  createExamRoom,
  assignInvigilator,
  removeAssignment,
  type SchedSession,
  type ExamRoom,
  type Invigilator,
} from '@/services/api';

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function fmtHM(iso: string): string {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Lịch thi & Phân công giám thị (khảo thí) — DỮ LIỆU THẬT từ ExamSession +
 * InvigilatorAssignment. Gán giám thị vào (phòng, ca); quản lý phòng thi.
 */
export function SchedulePanel() {
  const [sessions, setSessions] = useState<SchedSession[]>([]);
  const [rooms, setRooms] = useState<ExamRoom[]>([]);
  const [invigilators, setInvigilators] = useState<Invigilator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  // Modal phân công
  const [assignFor, setAssignFor] = useState<SchedSession | null>(null);
  const [pickRoom, setPickRoom] = useState('');
  const [pickInv, setPickInv] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Modal tạo phòng
  const [roomOpen, setRoomOpen] = useState(false);
  const [roomForm, setRoomForm] = useState({ code: '', name: '', capacity: 40, location: '' });
  const [savingRoom, setSavingRoom] = useState(false);

  const load = async () => {
    try {
      const [s, r, inv] = await Promise.all([
        getSchedulingSessions(),
        getExamRooms(),
        getInvigilators(),
      ]);
      setSessions(s);
      setRooms(r);
      setInvigilators(inv);
      setError(null);
    } catch {
      setError('Không tải được lịch thi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const flash = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg((v) => (v === m ? null : v)), 2000);
  };

  const openAssign = (s: SchedSession) => {
    setAssignFor(s);
    setPickRoom(rooms[0]?.id ?? '');
    setPickInv(invigilators[0]?.id ?? '');
    setError(null);
  };

  const handleAssign = async () => {
    if (!assignFor || !pickRoom || !pickInv || assigning) return;
    setAssigning(true);
    setError(null);
    try {
      await assignInvigilator(assignFor.id, pickRoom, pickInv);
      setAssignFor(null);
      flash('Đã phân công giám thị.');
      await load();
    } catch {
      setError('Phân công thất bại (có thể đã phân công giám thị này cho phòng).');
    } finally {
      setAssigning(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await removeAssignment(id);
      await load();
    } catch {
      setError('Gỡ phân công thất bại.');
    }
  };

  const handleCreateRoom = async () => {
    if (savingRoom) return;
    if (!roomForm.code.trim() || !roomForm.name.trim()) {
      setError('Nhập mã phòng và tên phòng.');
      return;
    }
    setSavingRoom(true);
    setError(null);
    try {
      await createExamRoom({
        code: roomForm.code.trim(),
        name: roomForm.name.trim(),
        capacity: Number(roomForm.capacity) || 1,
        location: roomForm.location.trim() || undefined,
      });
      setRoomOpen(false);
      setRoomForm({ code: '', name: '', capacity: 40, location: '' });
      flash('Đã tạo phòng thi.');
      await load();
    } catch {
      setError('Tạo phòng thất bại (mã phòng có thể đã tồn tại).');
    } finally {
      setSavingRoom(false);
    }
  };

  return (
    <div className="animate-[page-enter_0.3s_ease] flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Lịch Thi & Phân Công</h2>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setRoomOpen(true)} className="px-4 py-2 gap-2 text-sm">
            <DoorOpen className="w-4 h-4" /> Tạo phòng ({rooms.length})
          </Button>
        </div>
      </div>

      {msg && (
        <p className="flex items-center gap-1.5 text-[13px] font-medium text-emerald-600">
          <CheckCircle2 className="w-4 h-4" /> {msg}
        </p>
      )}
      {error && (
        <p className="flex items-center gap-1.5 text-[13px] font-medium text-rose-600">
          <AlertCircle className="w-4 h-4" /> {error}
        </p>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm py-6">
          <Loader2 className="w-4 h-4 animate-spin" /> Đang tải lịch thi…
        </div>
      ) : sessions.length === 0 ? (
        <GlassCard className="p-8 flex flex-col items-center text-center">
          <CalendarClock className="w-12 h-12 text-[var(--text-muted)] mb-3" />
          <p className="text-[var(--text-secondary)]">Chưa có ca thi nào.</p>
        </GlassCard>
      ) : (
        <GlassCard className="p-0 overflow-hidden">
          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--bg-glass)] border-b border-[var(--border-subtle)] text-[12px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  <th className="p-4 pl-6">Mã Ca</th>
                  <th className="p-4">Môn Thi / Đề</th>
                  <th className="p-4">Ngày — Giờ</th>
                  <th className="p-4">Giám Thị (phòng)</th>
                  <th className="p-4 pr-6 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-[13px]">
                {sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-[var(--bg-glass-light)] transition-colors align-top">
                    <td className="p-4 pl-6 text-[13px] font-semibold text-brand-600 dark:text-blue-400">{s.code}</td>
                    <td className="p-4">
                      <p className="text-[13px] font-medium text-[var(--text-primary)]">{s.exam?.title ?? s.name}</p>
                      <p className="text-[12px] text-[var(--text-muted)]">{s.exam?.code ?? '—'}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-[13px] font-medium text-[var(--text-primary)]">{fmtDate(s.examDate)}</p>
                      <p className="text-[12px] font-semibold text-indigo-600 dark:text-indigo-400">{fmtHM(s.startTime)}–{fmtHM(s.endTime)}</p>
                    </td>
                    <td className="p-4">
                      {s.assignments.length === 0 ? (
                        <span className="text-[12px] text-[var(--text-muted)] italic">Chưa phân công</span>
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          {s.assignments.map((a) => (
                            <span key={a.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--bg-glass)] border border-[var(--border-subtle)] text-[var(--text-primary)] w-fit">
                              {a.invigilatorName}
                              <span className="text-[var(--text-muted)]">· {a.roomCode}</span>
                              <button
                                onClick={() => handleRemove(a.id)}
                                aria-label="Gỡ phân công"
                                className="ml-0.5 text-[var(--text-muted)] hover:text-rose-500 transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <button
                        onClick={() => openAssign(s)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold bg-brand-50 border border-brand-500/40 text-brand-700 hover:bg-brand-100 dark:bg-blue-500/10 dark:border-blue-500/40 dark:text-blue-300 transition-colors"
                      >
                        <UserPlus className="w-3.5 h-3.5" /> Phân công
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {/* Modal: phân công giám thị */}
      <Modal
        isOpen={!!assignFor}
        onClose={() => setAssignFor(null)}
        title={assignFor ? `Phân công giám thị — ${assignFor.code}` : ''}
        className="max-w-md p-6"
      >
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[var(--text-secondary)]">Phòng thi</span>
            <select
              aria-label="Chọn phòng"
              value={pickRoom}
              onChange={(e) => setPickRoom(e.target.value)}
              className="px-3 py-2.5 rounded-[12px] text-[14px] bg-[var(--bg-glass)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            >
              {rooms.length === 0 && <option value="">(Chưa có phòng — hãy tạo phòng)</option>}
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>{r.name} ({r.code}) · {r.capacity} chỗ</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[var(--text-secondary)]">Giám thị</span>
            <select
              aria-label="Chọn giám thị"
              value={pickInv}
              onChange={(e) => setPickInv(e.target.value)}
              className="px-3 py-2.5 rounded-[12px] text-[14px] bg-[var(--bg-glass)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            >
              {invigilators.length === 0 && <option value="">(Chưa có giám thị đăng nhập)</option>}
              {invigilators.map((i) => (
                <option key={i.id} value={i.id}>{i.fullName}</option>
              ))}
            </select>
          </label>
          <div className="flex justify-end gap-3 pt-1">
            <Button variant="secondary" onClick={() => setAssignFor(null)} className="px-4 py-2 text-sm">Huỷ</Button>
            <Button
              variant="primary"
              onClick={handleAssign}
              disabled={assigning || !pickRoom || !pickInv}
              className="px-5 py-2 gap-2 text-sm"
            >
              {assigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Phân công
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: tạo phòng */}
      <Modal isOpen={roomOpen} onClose={() => setRoomOpen(false)} title="Tạo phòng thi" className="max-w-md p-6">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-[var(--text-secondary)]">Mã phòng</span>
              <input aria-label="Mã phòng" value={roomForm.code} onChange={(e) => setRoomForm({ ...roomForm, code: e.target.value })} placeholder="PM4" className="px-3 py-2.5 rounded-[12px] text-[14px] bg-[var(--bg-glass)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand-500/40" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-[var(--text-secondary)]">Sức chứa</span>
              <input aria-label="Sức chứa" type="number" min={1} value={roomForm.capacity} onChange={(e) => setRoomForm({ ...roomForm, capacity: Number(e.target.value) })} className="px-3 py-2.5 rounded-[12px] text-[14px] bg-[var(--bg-glass)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand-500/40" />
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[var(--text-secondary)]">Tên phòng</span>
            <input aria-label="Tên phòng" value={roomForm.name} onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })} placeholder="Phòng Máy 4" className="px-3 py-2.5 rounded-[12px] text-[14px] bg-[var(--bg-glass)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand-500/40" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[var(--text-secondary)]">Vị trí (tuỳ chọn)</span>
            <input aria-label="Vị trí" value={roomForm.location} onChange={(e) => setRoomForm({ ...roomForm, location: e.target.value })} placeholder="Tầng 3 — Nhà B" className="px-3 py-2.5 rounded-[12px] text-[14px] bg-[var(--bg-glass)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand-500/40" />
          </label>
          <div className="flex justify-end gap-3 pt-1">
            <Button variant="secondary" onClick={() => setRoomOpen(false)} className="px-4 py-2 text-sm">Huỷ</Button>
            <Button variant="primary" onClick={handleCreateRoom} disabled={savingRoom} className="px-5 py-2 gap-2 text-sm">
              {savingRoom ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Tạo phòng
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
