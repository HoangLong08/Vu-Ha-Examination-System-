import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { ExamsService } from '../exams/exams.service';
import { STAFF_ROLES } from '../common/constants/roles';
import { simulateStudentCode } from '../auth/auth.names';
import { SaveAnswerDto, AutoSaveDto } from './dto';

interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
}

@Injectable()
export class AttemptsService {
  private readonly logger = new Logger(AttemptsService.name);

  constructor(
    private prisma: PrismaService,
    private examsService: ExamsService,
  ) {}

  /**
   * Resolve (hoặc tạo) Student gắn với user đăng nhập — tránh placeholder studentId
   * (BUG-BE-007). Dev: Student.id = User.id để mọi truy vấn nhất quán.
   */
  private async resolveStudentId(user: AuthUser): Promise<string> {
    const student = await this.prisma.student.upsert({
      where: { id: user.id },
      update: {},
      create: {
        id: user.id,
        studentCode: simulateStudentCode(user.email),
        fullName: user.fullName || user.email,
        email: user.email,
      },
    });
    return student.id;
  }

  /**
   * POST /api/v1/exams/:examId/check-device — Pre-exam device check
   */
  async checkDevice(
    examId: string,
    data: {
      browserCompatible: boolean;
      audioFunctional: boolean;
      pingStable: boolean;
    },
  ) {
    // Log the device check result and return OK
    this.logger.log(
      `Device check for exam ${examId}: browser=${data.browserCompatible}, audio=${data.audioFunctional}, ping=${data.pingStable}`,
    );

    const allPassed =
      data.browserCompatible && data.audioFunctional && data.pingStable;

    return {
      passed: allPassed,
      checks: {
        browserCompatible: data.browserCompatible,
        audioFunctional: data.audioFunctional,
        pingStable: data.pingStable,
      },
    };
  }

  /**
   * POST /api/v1/exams/:examId/start — Start exam attempt
   */
  async startExam(
    user: AuthUser,
    examDefinitionId: string,
    clientIp?: string,
    userAgent?: string,
  ) {
    const studentId = await this.resolveStudentId(user);

    const examDef = await this.prisma.examDefinition.findUnique({
      where: { id: examDefinitionId },
    });
    if (!examDef) {
      throw new NotFoundException('Exam definition not found');
    }
    const totalSeconds = examDef.durationMinutes * 60;

    // Đã có lượt đang làm -> KHÔI PHỤC (cross-máy): trả lại đúng thời gian còn lại
    // tính theo đồng hồ server (server là nguồn chân lý).
    const existing = await this.prisma.examAttempt.findFirst({
      where: { studentId, examDefinitionId, status: 'IN_PROGRESS' },
      orderBy: { createdAt: 'desc' },
    });
    if (existing) {
      const elapsed = existing.startedAt
        ? Math.floor(
            (Date.now() - new Date(existing.startedAt).getTime()) / 1000,
          )
        : 0;
      return {
        attemptId: existing.id,
        startedAt: existing.startedAt,
        remainingSeconds: Math.max(0, totalSeconds - elapsed),
        status: existing.status,
        recovered: true,
      };
    }

    // FR-Q-003: chặn khi đã hết số lần thi cho phép (đếm các lượt đã hoàn thành).
    const finishedCount = await this.prisma.examAttempt.count({
      where: {
        studentId,
        examDefinitionId,
        status: { in: ['SUBMITTED', 'EXPIRED'] },
      },
    });
    const maxAttempt = examDef.maxAttempt ?? 1;
    if (finishedCount >= maxAttempt) {
      throw new BadRequestException({
        message:
          'Bạn đã hoàn thành bài thi này và đã sử dụng hết số lần thi được phép.',
        code: 'EXAM_ATTEMPT_LIMIT_REACHED',
      });
    }

    // BE-007: gắn attempt với CA THI THẬT (ExamSession qua SessionExam) nếu có,
    // thay vì để mồ côi / dùng examId làm sessionId. Không có ca -> null (hợp lệ).
    const sessionLink = await this.prisma.sessionExam.findFirst({
      where: { examDefinitionId },
      select: { sessionId: true },
    });

    // Lượt mới: tạo attempt + SNAPSHOT câu hỏi (kèm correctAnswer) vào AttemptQuestion
    // để chấm điểm chính xác lúc nộp.
    const now = new Date();
    const attempt = await this.prisma.examAttempt.create({
      data: {
        studentId,
        examDefinitionId,
        sessionId: sessionLink?.sessionId ?? null,
        status: 'IN_PROGRESS',
        startedAt: now,
        remainingSeconds: totalSeconds,
        clientIp,
        userAgent,
      },
    });

    const rawQuestions =
      await this.examsService.getQuestionsWithAnswers(examDefinitionId);
    if (rawQuestions.length > 0) {
      await this.prisma.attemptQuestion.createMany({
        data: rawQuestions.map((q: any, i: number) => ({
          attemptId: attempt.id,
          questionId: String(q.id),
          questionOrder: i,
          questionContent: q.content ?? '',
          questionType: q.type,
          questionSnapshot: {
            type: q.type,
            mediaUrl: q.mediaUrl ?? null,
            correctAnswer: Array.isArray(q.correctAnswer)
              ? q.correctAnswer.join(',')
              : String(q.correctAnswer ?? ''),
          },
        })),
      });
    }

    return {
      attemptId: attempt.id,
      startedAt: attempt.startedAt,
      remainingSeconds: attempt.remainingSeconds,
      status: attempt.status,
      recovered: false,
    };
  }

  /**
   * GET /api/v1/exams/:examId/attempt — Get attempt status
   */
  async getAttemptByExam(studentId: string, examDefinitionId: string) {
    const attempt = await this.prisma.examAttempt.findFirst({
      where: {
        studentId,
        examDefinitionId,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        answers: true,
      },
    });

    if (!attempt) {
      throw new NotFoundException('No attempt found for this exam');
    }

    return attempt;
  }

  /**
   * POST /api/v1/attempts/:attemptId/answers — Save single answer
   */
  async saveAnswer(attemptId: string, dto: SaveAnswerDto) {
    const attempt = await this.validateAttemptActive(attemptId);

    const answer = await this.prisma.attemptAnswer.upsert({
      where: {
        attemptId_questionId: {
          attemptId,
          questionId: dto.questionId,
        },
      },
      update: {
        answerValue: dto.answer,
        answeredAt: new Date(),
      },
      create: {
        attemptId,
        questionId: dto.questionId,
        answerValue: dto.answer,
        answeredAt: new Date(),
      },
    });

    return answer;
  }

  /**
   * GET /api/v1/attempts/:attemptId/answers — Get all answers
   */
  async getAnswers(attemptId: string) {
    const answers = await this.prisma.attemptAnswer.findMany({
      where: { attemptId },
      orderBy: { answeredAt: 'asc' },
    });

    return answers;
  }

  /**
   * POST /api/v1/attempts/:attemptId/autosave — Autosave all answers
   */
  async autoSave(attemptId: string, dto: AutoSaveDto) {
    await this.validateAttemptActive(attemptId);

    const results = await Promise.all(
      dto.answers.map((answer) =>
        this.prisma.attemptAnswer.upsert({
          where: {
            attemptId_questionId: {
              attemptId,
              questionId: answer.questionId,
            },
          },
          update: {
            answerValue: answer.answer,
            answeredAt: new Date(answer.timestamp),
          },
          create: {
            attemptId,
            questionId: answer.questionId,
            answerValue: answer.answer,
            answeredAt: new Date(answer.timestamp),
          },
        }),
      ),
    );

    // Update remaining seconds on the attempt
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
    });

    if (attempt && attempt.startedAt) {
      const elapsed = Math.floor(
        (Date.now() - attempt.startedAt.getTime()) / 1000,
      );
      const examDef = await this.prisma.examDefinition.findUnique({
        where: { id: attempt.examDefinitionId },
      });
      const totalSeconds = (examDef?.durationMinutes || 60) * 60;
      const remaining = Math.max(0, totalSeconds - elapsed);

      await this.prisma.examAttempt.update({
        where: { id: attemptId },
        data: { remainingSeconds: remaining },
      });
    }

    return {
      savedCount: results.length,
      savedAt: new Date().toISOString(),
    };
  }

  /**
   * GET /api/v1/attempts/:attemptId/recovery — Recovery data
   */
  async getRecovery(attemptId: string) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        answers: true,
        questions: true,
      },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    return {
      attemptId: attempt.id,
      status: attempt.status,
      startedAt: attempt.startedAt,
      remainingSeconds: attempt.remainingSeconds,
      answers: attempt.answers,
      questions: attempt.questions,
    };
  }

  /**
   * Tính ĐIỂM TỪNG PHẦN (credit, 0..1) cho một câu trả lời so với đáp án đúng.
   * Business rules (US-076/077/078):
   *  - SINGLE_CHOICE / TRUE_FALSE: đúng = 1, sai = 0.
   *  - MULTIPLE_CHOICE theo cấu hình `gradingMode`:
   *      + ALL_OR_NOTHING (mặc định): khớp đúng toàn bộ tập đáp án => 1, lệch => 0.
   *      + PARTIAL: credit = max(0, (số chọn đúng − số chọn sai) / số đáp án đúng).
   *  - bỏ trống / null => 0.
   */
  private answerCredit(
    type: string,
    correctAnswer: string,
    answerValue: string | null | undefined,
    gradingMode: 'ALL_OR_NOTHING' | 'PARTIAL' = 'ALL_OR_NOTHING',
  ): number {
    if (
      answerValue === null ||
      answerValue === undefined ||
      answerValue.trim() === '' ||
      !correctAnswer
    ) {
      return 0;
    }
    const norm = (s: string) => s.trim().toUpperCase();

    // Điền khuyết: khớp 1 trong các đáp án chấp nhận (ngăn bằng `|`).
    if (type === 'FILL_BLANK') {
      const accepted = correctAnswer.split('|').map(norm).filter(Boolean);
      return accepted.includes(norm(answerValue)) ? 1 : 0;
    }
    // Điền giá trị: so sánh dạng SỐ (chấp nhận dấu phẩy thập phân).
    if (type === 'NUMERIC') {
      const a = parseFloat(answerValue.replace(',', '.'));
      const b = parseFloat(correctAnswer.replace(',', '.'));
      return !isNaN(a) && !isNaN(b) && Math.abs(a - b) < 1e-6 ? 1 : 0;
    }
    // Gán MỤC→ĐÍCH (đối sánh / sắp thứ tự / phân loại): chấm theo TỈ LỆ đúng.
    if (type === 'MATCHING' || type === 'ORDERING' || type === 'CLASSIFY') {
      const parse = (s: string) =>
        new Map(
          s
            .split(',')
            .map((p) => p.split(':').map(norm))
            .filter((x) => x.length === 2 && x[0]) as [string, string][],
        );
      const expected = parse(correctAnswer);
      const given = parse(answerValue);
      if (expected.size === 0) return 0;
      let ok = 0;
      for (const [k, v] of expected) if (given.get(k) === v) ok += 1;
      return ok / expected.size; // partial credit
    }

    // Chọn vùng ảnh (Hot Area / Point and Shoot): đáp án = các điểm click
    // "x,y;x,y" (chuẩn hoá 0..1); vùng đúng = các HCN "x1,y1,x2,y2;...".
    // Credit = max(0, (số vùng trúng − số click trượt) / số vùng). Chống click bừa.
    if (type === 'HOTSPOT') {
      const rects = correctAnswer
        .split(';')
        .map((r) => r.split(',').map(Number))
        .filter((r) => r.length === 4 && r.every((n) => !isNaN(n)));
      const points = answerValue
        .split(';')
        .map((p) => p.split(',').map(Number))
        .filter((p) => p.length === 2 && p.every((n) => !isNaN(n)));
      if (rects.length === 0) return 0;
      const inside = (px: number, py: number, r: number[]) =>
        px >= Math.min(r[0], r[2]) &&
        px <= Math.max(r[0], r[2]) &&
        py >= Math.min(r[1], r[3]) &&
        py <= Math.max(r[1], r[3]);
      const hit = new Set<number>();
      let miss = 0;
      for (const [px, py] of points) {
        const idx = rects.findIndex((r) => inside(px, py, r));
        if (idx >= 0) hit.add(idx);
        else miss += 1;
      }
      return Math.max(0, (hit.size - miss) / rects.length);
    }

    if (type === 'MULTIPLE_CHOICE') {
      const expected = new Set(
        correctAnswer.split(',').map(norm).filter(Boolean),
      );
      const given = new Set(answerValue.split(',').map(norm).filter(Boolean));
      if (expected.size === 0) return 0;

      if (gradingMode === 'PARTIAL') {
        let correctSel = 0;
        let wrongSel = 0;
        for (const g of given) {
          if (expected.has(g)) correctSel += 1;
          else wrongSel += 1;
        }
        return Math.max(0, (correctSel - wrongSel) / expected.size);
      }

      // ALL_OR_NOTHING: phải khớp chính xác, không thiếu/không thừa.
      if (expected.size !== given.size) return 0;
      for (const g of given) {
        if (!expected.has(g)) return 0;
      }
      return 1;
    }
    // SINGLE_CHOICE, TRUE_FALSE, image-based single answer
    return norm(correctAnswer) === norm(answerValue) ? 1 : 0;
  }

  /**
   * POST /api/v1/attempts/:attemptId/submit — Submit exam
   *
   * Auto-grades the attempt: for every question of the exam it compares the
   * student's saved answer against the question snapshot's correctAnswer.
   * Unanswered questions count as wrong (mẫu số = tổng số câu của đề, không phải
   * số câu đã trả lời).
   */
  async submit(attemptId: string) {
    await this.validateAttemptActive(attemptId);
    const updatedAttempt = await this.prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
        remainingSeconds: 0,
      },
    });
    await this.gradeAttempt(attemptId); // chấm tự động + ghi Result (tự luận = 0, chờ chấm)
    return {
      attemptId: updatedAttempt.id,
      status: updatedAttempt.status,
      submittedAt: updatedAttempt.submittedAt,
    };
  }

  /**
   * Chấm lại 1 lượt và GHI/CẬP NHẬT Result. Câu tự chấm dùng answerCredit; câu
   * TỰ LUẬN (ESSAY) dùng điểm chấm tay `manualCredit` (chưa chấm => 0). Dùng cho
   * cả lúc nộp và sau khi khảo thí chấm tự luận.
   */
  private async gradeAttempt(attemptId: string) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
    });
    if (!attempt) return;

    const [questions, answers] = await Promise.all([
      this.prisma.attemptQuestion.findMany({ where: { attemptId } }),
      this.prisma.attemptAnswer.findMany({ where: { attemptId } }),
    ]);
    const ansByQuestion = new Map(answers.map((a) => [a.questionId, a]));

    let creditSum = 0;
    let correctAnswers = 0;
    for (const q of questions) {
      const snapshot = (q.questionSnapshot ?? {}) as {
        correctAnswer?: string;
        type?: string;
        gradingMode?: 'ALL_OR_NOTHING' | 'PARTIAL';
      };
      const type = snapshot.type ?? q.questionType;
      const ans = ansByQuestion.get(q.questionId);
      let credit: number;
      if (type === 'ESSAY') {
        credit = ans?.manualCredit ?? 0; // chấm tay; chưa chấm => 0
      } else {
        credit = this.answerCredit(
          type,
          snapshot.correctAnswer ?? '',
          ans?.answerValue,
          snapshot.gradingMode ?? 'ALL_OR_NOTHING',
        );
      }
      creditSum += credit;
      if (credit === 1) correctAnswers += 1;
    }

    const totalQuestions = questions.length;
    const wrongAnswers = totalQuestions - correctAnswers;
    const score =
      totalQuestions > 0
        ? Math.round((creditSum / totalQuestions) * 10 * 100) / 100
        : 0;

    await this.prisma.result.upsert({
      where: { attemptId },
      update: { totalQuestions, correctAnswers, wrongAnswers, score },
      create: {
        attemptId,
        studentId: attempt.studentId,
        examDefinitionId: attempt.examDefinitionId,
        totalQuestions,
        correctAnswers,
        wrongAnswers,
        score,
        published: false,
      },
    });
  }

  /**
   * Khảo thí CHẤM TAY một câu tự luận của một lượt: lưu điểm (0..1) rồi chấm lại.
   */
  async gradeEssay(attemptId: string, questionId: string, credit: number) {
    const c = Math.max(0, Math.min(1, credit));
    await this.prisma.attemptAnswer.upsert({
      where: { attemptId_questionId: { attemptId, questionId } },
      update: { manualCredit: c },
      create: { attemptId, questionId, answerValue: null, manualCredit: c },
    });
    await this.gradeAttempt(attemptId);
    return { attemptId, questionId, manualCredit: c };
  }

  /**
   * Danh sách bài tự luận CẦN CHẤM của một đề (các lượt đã nộp): kèm tên SV, nội
   * dung câu + bài viết + điểm đã chấm (nếu có).
   */
  async listEssayAnswers(examDefinitionId: string) {
    const attempts = await this.prisma.examAttempt.findMany({
      where: { examDefinitionId, status: 'SUBMITTED' },
      include: { student: { select: { fullName: true, studentCode: true } } },
      orderBy: { submittedAt: 'desc' },
    });

    const out: Array<{
      attemptId: string;
      studentName: string;
      studentCode: string;
      essays: Array<{
        questionId: string;
        content: string;
        answer: string;
        manualCredit: number | null;
      }>;
    }> = [];

    for (const a of attempts) {
      const essays = await this.prisma.attemptQuestion.findMany({
        where: { attemptId: a.id, questionType: 'ESSAY' },
        orderBy: { questionOrder: 'asc' },
      });
      if (essays.length === 0) continue;
      const ans = await this.prisma.attemptAnswer.findMany({
        where: { attemptId: a.id },
      });
      const byQ = new Map(ans.map((x) => [x.questionId, x]));
      out.push({
        attemptId: a.id,
        studentName: a.student?.fullName ?? 'Sinh viên',
        studentCode: a.student?.studentCode ?? '',
        essays: essays.map((e) => {
          const x = byQ.get(e.questionId);
          return {
            questionId: e.questionId,
            content: e.questionContent,
            answer: x?.answerValue ?? '',
            manualCredit: x?.manualCredit ?? null,
          };
        }),
      });
    }
    return out;
  }

  /**
   * Danh sách BÀI LÀM của một đề cho khảo thí/admin: ai đã/đang làm, trả lời bao
   * nhiêu câu, điểm bao nhiêu, trạng thái. Gồm cả lượt đang làm (IN_PROGRESS) lẫn
   * đã nộp (SUBMITTED) để giám sát + đối soát. Mới nhất lên đầu.
   */
  async listAttempts(examDefinitionId: string) {
    const attempts = await this.prisma.examAttempt.findMany({
      where: { examDefinitionId },
      include: { student: { select: { fullName: true, studentCode: true } } },
      orderBy: [{ submittedAt: 'desc' }, { startedAt: 'desc' }],
    });

    const out: Array<{
      attemptId: string;
      studentName: string;
      studentCode: string;
      status: string;
      startedAt: Date | null;
      submittedAt: Date | null;
      answeredCount: number;
      totalQuestions: number;
      score: number | null;
      correctAnswers: number | null;
      published: boolean;
    }> = [];

    for (const a of attempts) {
      const [totalQuestions, answers, result] = await Promise.all([
        this.prisma.attemptQuestion.count({ where: { attemptId: a.id } }),
        this.prisma.attemptAnswer.findMany({
          where: { attemptId: a.id },
          select: { answerValue: true },
        }),
        this.prisma.result.findUnique({ where: { attemptId: a.id } }),
      ]);
      const answeredCount = answers.filter(
        (x) => (x.answerValue ?? '').trim() !== '',
      ).length;
      out.push({
        attemptId: a.id,
        studentName: a.student?.fullName ?? 'Sinh viên',
        studentCode: a.student?.studentCode ?? '',
        status: a.status,
        startedAt: a.startedAt,
        submittedAt: a.submittedAt,
        answeredCount,
        totalQuestions,
        score: result?.score ?? null,
        correctAnswers: result?.correctAnswers ?? null,
        published: result?.published ?? false,
      });
    }
    return out;
  }

  /**
   * US-074 — Tự động nộp bài khi hết thời gian.
   *
   * Quét các attempt đang IN_PROGRESS, với mỗi attempt tính thời gian đã trôi qua
   * (now − startedAt) so với thời lượng đề; nếu đã hết giờ thì gọi submit() để
   * chấm điểm + lưu kết quả + chuyển trạng thái SUBMITTED (khóa chỉnh sửa).
   * Tham số `now` cho phép kiểm thử xác định.
   */
  async autoSubmitExpired(
    now: Date = new Date(),
  ): Promise<{ submitted: number }> {
    const inProgress = await this.prisma.examAttempt.findMany({
      where: { status: 'IN_PROGRESS' },
    });

    let submitted = 0;
    for (const att of inProgress) {
      if (!att.startedAt) continue;

      const examDef = await this.prisma.examDefinition.findUnique({
        where: { id: att.examDefinitionId },
      });
      const durationSeconds = (examDef?.durationMinutes ?? 60) * 60;
      const elapsedSeconds =
        (now.getTime() - new Date(att.startedAt).getTime()) / 1000;

      if (elapsedSeconds >= durationSeconds) {
        try {
          await this.submit(att.id);
          submitted += 1;
        } catch (err) {
          this.logger.warn(
            `Auto-submit thất bại cho attempt ${att.id}: ${String(err)}`,
          );
        }
      }
    }

    if (submitted > 0) {
      this.logger.log(`Đã tự động nộp ${submitted} bài thi hết giờ`);
    }
    return { submitted };
  }

  /**
   * Cron mỗi phút: cưỡng chế nộp các bài thi đã hết giờ (US-074).
   * Không phụ thuộc client gọi autosave.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleAutoSubmitExpired(): Promise<void> {
    await this.autoSubmitExpired();
  }

  /** Vai trò nhân sự khảo thí được xem kết quả mọi lúc (ADMIN, EXAM_OFFICER). */
  private static readonly PRIVILEGED_RESULT_ROLES: string[] = STAFF_ROLES;

  /**
   * GET /api/v1/results/:attemptId — Get result.
   * FR-L-001: sinh viên chỉ xem được kết quả KHI đã công bố; ADMIN/EXAM_OFFICER
   * xem được mọi lúc. `viewerRoles` lấy từ người dùng đăng nhập.
   */
  async getResult(attemptId: string, viewerRoles: string[] = []) {
    const result = await this.prisma.result.findUnique({
      where: { attemptId },
    });

    if (!result) {
      throw new NotFoundException('Result not found');
    }

    const privileged = viewerRoles.some((r) =>
      AttemptsService.PRIVILEGED_RESULT_ROLES.includes(r),
    );
    if (!result.published && !privileged) {
      throw new ForbiddenException('Kết quả chưa được công bố');
    }

    return result;
  }

  /**
   * GET /api/v1/attempts/:attemptId/review — Kết quả CHI TIẾT của lượt làm bài.
   * FR-L-003: hiển thị điểm/đáp án NGAY sau khi nộp NẾU đề bật `showResult`;
   * nếu tắt -> chỉ báo hoàn thành (giấu điểm). Khảo thí/Admin luôn xem được.
   */
  async getAttemptReview(attemptId: string, viewerRoles: string[] = []) {
    const result = await this.prisma.result.findUnique({
      where: { attemptId },
    });
    if (!result) {
      throw new NotFoundException('Result not found');
    }

    const examDef = await this.prisma.examDefinition.findUnique({
      where: { id: result.examDefinitionId },
    });
    const showResult = examDef?.showResult ?? true;
    const privileged = viewerRoles.some((r) =>
      AttemptsService.PRIVILEGED_RESULT_ROLES.includes(r),
    );

    const [questions, answers] = await Promise.all([
      this.prisma.attemptQuestion.findMany({
        where: { attemptId },
        orderBy: { questionOrder: 'asc' },
      }),
      this.prisma.attemptAnswer.findMany({ where: { attemptId } }),
    ]);
    const answerByQuestion = new Map(
      answers.map((a) => [a.questionId, a.answerValue]),
    );

    const review = questions.map((q) => {
      const snapshot = (q.questionSnapshot ?? {}) as {
        correctAnswer?: string;
        type?: string;
        gradingMode?: 'ALL_OR_NOTHING' | 'PARTIAL';
      };
      const type = snapshot.type ?? q.questionType;
      const correctAnswer = snapshot.correctAnswer ?? '';
      const yourAnswer = answerByQuestion.get(q.questionId) ?? null;
      const credit = this.answerCredit(
        type,
        correctAnswer,
        yourAnswer,
        snapshot.gradingMode ?? 'ALL_OR_NOTHING',
      );
      const status =
        yourAnswer === null || yourAnswer === ''
          ? 'skipped'
          : credit === 1
            ? 'correct'
            : 'wrong';
      return {
        questionId: q.questionId,
        order: q.questionOrder,
        content: q.questionContent,
        type,
        yourAnswer,
        correctAnswer,
        status,
      };
    });

    const answeredCount = review.filter((r) => r.status !== 'skipped').length;
    const summary = {
      total: review.length,
      answered: answeredCount,
      skipped: review.length - answeredCount,
    };

    // Đề tắt xem điểm + người xem là SV: giấu điểm/đáp án, chỉ báo hoàn thành.
    if (!showResult && !privileged) {
      return { showResult: false, result: null, review: [], summary };
    }
    return { showResult: true, result, review, summary };
  }

  /**
   * GET /api/v1/student/results — Lịch sử kết quả của sinh viên (chỉ kết quả ĐÃ công bố).
   */
  async getStudentResults(studentId: string) {
    const results = await this.prisma.result.findMany({
      where: { studentId, published: true },
      include: {
        examDefinition: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return results;
  }

  /**
   * POST /api/v1/exams/:examDefinitionId/results/publish — Công bố kết quả (EPIC-18, UC-046).
   * Chỉ ADMIN / EXAM_OFFICER (chặn ở controller).
   */
  async publishResults(examDefinitionId: string) {
    const res = await this.prisma.result.updateMany({
      where: { examDefinitionId },
      data: { published: true, publishedAt: new Date() },
    });
    this.logger.log(
      `Đã công bố ${res.count} kết quả của đề ${examDefinitionId}`,
    );
    return { published: res.count };
  }

  /**
   * POST /api/v1/exams/:examDefinitionId/results/unpublish — Ẩn kết quả (UC-047).
   */
  async unpublishResults(examDefinitionId: string) {
    const res = await this.prisma.result.updateMany({
      where: { examDefinitionId },
      data: { published: false, publishedAt: null },
    });
    this.logger.log(`Đã ẩn ${res.count} kết quả của đề ${examDefinitionId}`);
    return { unpublished: res.count };
  }

  private async validateAttemptActive(attemptId: string) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    if (attempt.status !== 'IN_PROGRESS') {
      throw new BadRequestException(
        `Attempt is ${attempt.status}, cannot modify`,
      );
    }

    return attempt;
  }
}
