import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Phân hệ LỊCH THI (khảo thí): phòng thi + PHÂN CÔNG GIÁM THỊ vào phòng/ca.
 * Dữ liệu thật từ ExamRoom / ExamSession / InvigilatorAssignment.
 */
@Injectable()
export class SchedulingService {
  constructor(private prisma: PrismaService) {}

  /** Danh sách ca thi kèm đề (SessionExam) + phòng + giám thị đã phân công. */
  async listSessions() {
    const sessions = await this.prisma.examSession.findMany({
      orderBy: [{ examDate: 'asc' }, { startTime: 'asc' }],
      include: {
        sessionExams: {
          include: {
            examDefinition: { select: { id: true, code: true, title: true } },
          },
        },
        invigilatorAssignments: {
          include: {
            room: { select: { id: true, name: true, code: true } },
            invigilator: { select: { id: true, fullName: true, email: true } },
          },
        },
      },
    });

    return sessions.map((s) => {
      const def = s.sessionExams[0]?.examDefinition ?? null;
      return {
        id: s.id,
        code: s.code,
        name: s.name,
        examDate: s.examDate,
        startTime: s.startTime,
        endTime: s.endTime,
        durationMinutes: s.durationMinutes,
        status: s.status,
        exam: def ? { defId: def.id, code: def.code, title: def.title } : null,
        assignments: s.invigilatorAssignments.map((a) => ({
          id: a.id,
          roomId: a.roomId,
          roomName: a.room?.name ?? '',
          roomCode: a.room?.code ?? '',
          invigilatorId: a.invigilatorId,
          invigilatorName:
            a.invigilator?.fullName ?? a.invigilator?.email ?? '',
        })),
      };
    });
  }

  /** Danh sách phòng thi. */
  listRooms() {
    return this.prisma.examRoom.findMany({ orderBy: { code: 'asc' } });
  }

  /** Tạo phòng thi mới. */
  async createRoom(dto: {
    code: string;
    name: string;
    capacity: number;
    location?: string;
  }) {
    const existed = await this.prisma.examRoom.findUnique({
      where: { code: dto.code },
    });
    if (existed) throw new ConflictException('Mã phòng đã tồn tại');
    return this.prisma.examRoom.create({
      data: {
        code: dto.code,
        name: dto.name,
        capacity: dto.capacity,
        location: dto.location ?? null,
      },
    });
  }

  /** Danh sách giám thị (User có vai trò INVIGILATOR). */
  listInvigilators() {
    return this.prisma.user.findMany({
      where: { userRoles: { some: { role: { code: 'INVIGILATOR' } } } },
      select: { id: true, fullName: true, email: true },
      orderBy: { fullName: 'asc' },
    });
  }

  /** Phân công 1 giám thị vào (phòng, ca). */
  async assignInvigilator(
    sessionId: string,
    roomId: string,
    invigilatorId: string,
  ) {
    const [session, room, inv] = await Promise.all([
      this.prisma.examSession.findUnique({ where: { id: sessionId } }),
      this.prisma.examRoom.findUnique({ where: { id: roomId } }),
      this.prisma.user.findUnique({ where: { id: invigilatorId } }),
    ]);
    if (!session) throw new NotFoundException('Không tìm thấy ca thi');
    if (!room) throw new NotFoundException('Không tìm thấy phòng thi');
    if (!inv) throw new NotFoundException('Không tìm thấy giám thị');

    const dup = await this.prisma.invigilatorAssignment.findUnique({
      where: {
        roomId_sessionId_invigilatorId: { roomId, sessionId, invigilatorId },
      },
    });
    if (dup)
      throw new ConflictException('Giám thị đã được phân công phòng này');

    return this.prisma.invigilatorAssignment.create({
      data: { sessionId, roomId, invigilatorId },
    });
  }

  /** Gỡ phân công giám thị. */
  async removeAssignment(id: string) {
    const a = await this.prisma.invigilatorAssignment.findUnique({
      where: { id },
    });
    if (!a) throw new NotFoundException('Không tìm thấy phân công');
    await this.prisma.invigilatorAssignment.delete({ where: { id } });
    return { ok: true };
  }
}
