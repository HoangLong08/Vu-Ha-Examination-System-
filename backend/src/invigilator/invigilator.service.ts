import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  simulateFullName,
  simulatePhone,
  simulateStudentCode,
} from '../auth/auth.names';

/**
 * Sĩ số phòng thi = 20 TÀI KHOẢN SINH VIÊN giả lập (sv001..sv020) — KHỚP với 20
 * tài khoản test. Đăng nhập tài khoản nào + vào thi thì dòng đó chuyển sang trạng
 * thái thật (đang làm/đã nộp/điểm); còn lại hiển thị "Chưa đăng nhập".
 */
const STUDENT_EMAILS = Array.from(
  { length: 20 },
  (_, i) => `sv${String(i + 1).padStart(3, '0')}@dau.edu.vn`,
);

/**
 * Giám thị — dữ liệu THẬT từ ExamAttempt. Mỗi đề thi (ExamDefinition) có lượt thi
 * được coi như một "ca/phòng"; sinh viên = các lượt làm bài thật (đang làm/đã nộp).
 */
@Injectable()
export class InvigilatorService {
  constructor(private prisma: PrismaService) {}

  /** Danh sách "ca thi" = các đề có lượt làm bài, kèm số liệu trạng thái. */
  async getSessions() {
    const attempts = await this.prisma.examAttempt.findMany({
      include: { examDefinition: { select: { code: true, title: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const byExam = new Map<
      string,
      {
        id: string;
        code: string;
        title: string;
        total: number;
        inProgress: number;
        submitted: number;
        earliestCreatedAt: Date;
      }
    >();
    for (const a of attempts) {
      const cur = byExam.get(a.examDefinitionId) ?? {
        id: a.examDefinitionId,
        code: a.examDefinition?.code ?? '',
        title: a.examDefinition?.title ?? 'Đề thi',
        total: 0,
        inProgress: 0,
        submitted: 0,
        earliestCreatedAt: a.createdAt,
      };
      cur.total += 1;
      if (a.status === 'IN_PROGRESS') cur.inProgress += 1;
      if (a.status === 'SUBMITTED' || a.status === 'EXPIRED')
        cur.submitted += 1;
      if (a.createdAt < cur.earliestCreatedAt)
        cur.earliestCreatedAt = a.createdAt;
      byExam.set(a.examDefinitionId, cur);
    }

    return [...byExam.values()].map((e) => ({
      id: e.id,
      code: e.code,
      title: e.title,
      // Sĩ số phòng = 20 tài khoản SV giả lập (≥ số đã vào thi thật).
      totalStudents: Math.max(STUDENT_EMAILS.length, e.total),
      inProgress: e.inProgress,
      submitted: e.submitted,
      // Ngày thi (yyyy-mm-dd): chưa có lịch thi thật (ExamSession) gắn với lượt
      // thi mock nên dùng ngày lượt thi ĐẦU TIÊN của đề làm mốc hiển thị/lọc.
      examDate: e.earliestCreatedAt.toISOString().slice(0, 10),
      // Trạng thái THẬT theo lượt thi: đang làm -> ONGOING; có người nộp mà không
      // ai đang làm -> COMPLETED; chưa ai vào -> UPCOMING.
      status:
        e.inProgress > 0
          ? 'ONGOING'
          : e.submitted > 0
            ? 'COMPLETED'
            : 'UPCOMING',
    }));
  }

  /**
   * Danh sách phòng thi của một đề = DANH SÁCH LỚP (giả lập theo sĩ số) GHÉP với
   * LƯỢT THI THẬT: ai đã vào thi -> trạng thái thật (đang làm/đã nộp + tiến độ);
   * còn lại -> "Chưa đăng nhập" (NOT_STARTED). sessionId = examDefinitionId.
   */
  async getSessionStudents(examDefinitionId: string) {
    const [attempts, def] = await Promise.all([
      this.prisma.examAttempt.findMany({
        where: { examDefinitionId },
        include: {
          student: { select: { fullName: true, studentCode: true } },
          result: { select: { score: true } },
          _count: { select: { answers: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.examDefinition.findUnique({
        where: { id: examDefinitionId },
        select: { totalQuestions: true, durationMinutes: true },
      }),
    ]);

    const total = def?.totalQuestions ?? 0;
    const durationSec = (def?.durationMinutes ?? 0) * 60;
    const now = Date.now();

    // Lượt thi THẬT (đã vào thi).
    const real = attempts.map((a) => {
      let remainingSeconds: number | null = null;
      if (a.status === 'IN_PROGRESS' && a.startedAt) {
        const elapsed = Math.floor(
          (now - new Date(a.startedAt).getTime()) / 1000,
        );
        remainingSeconds = Math.max(0, durationSec - elapsed);
      }
      const code = a.student?.studentCode ?? '';
      const submitted = a.status === 'SUBMITTED' || a.status === 'EXPIRED';
      return {
        fullName: a.student?.fullName ?? 'Sinh viên',
        studentCode: code,
        phone: simulatePhone(code || a.studentId),
        ipAddress: a.clientIp ?? null,
        status: a.status, // IN_PROGRESS | SUBMITTED | EXPIRED
        answered: a._count.answers,
        total,
        // Điểm chỉ có ý nghĩa khi đã nộp (đã chấm); còn lại null.
        score: submitted ? (a.result?.score ?? null) : null,
        remainingSeconds,
      };
    });

    // Sĩ số phòng = 20 tài khoản SV (sv001..sv020). Ai ĐÃ có lượt thi thật thì
    // bỏ khỏi roster (đã nằm ở `real`); còn lại hiển thị "Chưa đăng nhập".
    const realCodes = new Set(real.map((r) => r.studentCode));
    const roster = STUDENT_EMAILS.map((email) => ({
      fullName: simulateFullName(email),
      studentCode: simulateStudentCode(email),
    }))
      .filter((s) => !realCodes.has(s.studentCode))
      .map((s) => ({
        fullName: s.fullName,
        studentCode: s.studentCode,
        phone: simulatePhone(s.studentCode),
        ipAddress: null,
        status: 'NOT_STARTED',
        answered: 0,
        total,
        score: null,
        remainingSeconds: null,
      }));

    // Sắp xếp mã SV cho gọn rồi gán số máy theo vị trí. id theo CHỈ SỐ dòng để
    // luôn duy nhất (tránh trùng key khi mã SV trùng: thi lại / mã cũ).
    return [...real, ...roster]
      .sort((a, b) => a.studentCode.localeCompare(b.studentCode))
      .map((s, i) => ({
        id: `${examDefinitionId}-row-${i}`,
        machineId: `PC-${String(i + 1).padStart(2, '0')}`,
        ...s,
      }));
  }

  /**
   * Giám thị CẤP LẠI MẬT KHẨU cho thí sinh. Hệ đăng nhập qua dev-login/partner
   * (KHÔNG lưu mật khẩu cục bộ) nên theo QUY ƯỚC: mật khẩu mới = MÃ SỐ SINH VIÊN.
   * Ghi AuditLog để truy vết. Trả mã để giám thị đọc cho thí sinh.
   */
  async resetPassword(studentCode: string, actorUserId: string) {
    const student = await this.prisma.student.findUnique({
      where: { studentCode },
    });
    await this.prisma.auditLog.create({
      data: {
        userId: actorUserId,
        action: 'INVIGILATOR_RESET_PASSWORD',
        entityType: 'Student',
        entityId: student?.id ?? null,
        newValue: { studentCode, newPassword: studentCode },
      },
    });
    return {
      ok: true,
      studentCode,
      newPassword: studentCode,
      exists: !!student,
    };
  }

  /**
   * Giám thị ĐỔI MÁY / KHÔI PHỤC PHIÊN: gỡ ràng buộc máy (IP/userAgent) trên lượt
   * thi đang làm để thí sinh đăng nhập lại trên máy khác là tiếp tục (recovery).
   * Ghi AuditLog. `cleared`=true nếu có lượt đang làm được gỡ.
   */
  async resetSession(
    examDefinitionId: string,
    studentCode: string,
    actorUserId: string,
  ) {
    const student = await this.prisma.student.findUnique({
      where: { studentCode },
    });
    let cleared = false;
    if (student) {
      const res = await this.prisma.examAttempt.updateMany({
        where: {
          studentId: student.id,
          examDefinitionId,
          status: 'IN_PROGRESS',
        },
        data: { clientIp: null, userAgent: null },
      });
      cleared = res.count > 0;
    }
    await this.prisma.auditLog.create({
      data: {
        userId: actorUserId,
        action: 'INVIGILATOR_RESET_SESSION',
        entityType: 'ExamAttempt',
        entityId: student?.id ?? null,
        newValue: { studentCode, examDefinitionId, cleared },
      },
    });
    return { ok: true, cleared };
  }
}
