import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateViolationDto } from './dto';

@Injectable()
export class ViolationsService {
  private readonly logger = new Logger(ViolationsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * POST /api/v1/violations — Record a violation
   */
  async create(dto: CreateViolationDto) {
    const violation = await this.prisma.violation.create({
      data: {
        studentId: dto.studentId,
        sessionId: dto.sessionId,
        roomId: dto.roomId,
        machineNumber: dto.machineNumber,
        type: dto.type,
        description: dto.description,
        recordedBy: dto.recordedBy || 'SYSTEM',
        recordedAt: new Date(),
      },
    });

    this.logger.warn(
      `Violation recorded: student=${dto.studentId}, type=${dto.type}, desc=${dto.description}`,
    );

    return violation;
  }

  /**
   * Get violations for a session
   */
  async findBySession(sessionId: string) {
    return this.prisma.violation.findMany({
      where: { sessionId },
      include: {
        student: true,
        attachments: true,
      },
      orderBy: { recordedAt: 'desc' },
    });
  }

  /**
   * Get violations for a student in a session
   */
  async findByStudentSession(studentId: string, sessionId: string) {
    return this.prisma.violation.findMany({
      where: { studentId, sessionId },
      include: {
        attachments: true,
      },
      orderBy: { recordedAt: 'desc' },
    });
  }

  /**
   * POST /api/v1/violations/:id/attachments — Upload attachment
   */
  async addAttachment(violationId: string, fileName: string, fileUrl: string) {
    return this.prisma.violationAttachment.create({
      data: {
        violationId,
        fileName,
        fileUrl,
        uploadedAt: new Date(),
      },
    });
  }
}
