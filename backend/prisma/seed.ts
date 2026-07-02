import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/dau_exam';
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

/**
 * Seed dữ liệu demo tối thiểu để chạy thật luồng thi:
 * 1 ExamDefinition (id cố định) — frontend trỏ tới id này khi "Vào thi".
 * Câu hỏi lấy từ mock-api/questions.json (snapshot khi startExam).
 * Student được tạo tự động theo user đăng nhập (resolveStudentId).
 */
export const SEED_EXAM_DEF_ID = '11111111-1111-4111-8111-111111111111';

// EPIC-21: các đề trỏ nguồn exam-core (fixture) — bật bằng EXAM_SOURCE=exam-core.
// ID bank/matrix khớp backend/src/exam-core/fixtures/exam-core.fixtures.ts.
export const SEED_EXAM_LSD_ID = '22222222-2222-4222-8222-222222222222';
export const SEED_EXAM_ENG_ID = '33333333-3333-4333-8333-333333333333';
export const SEED_EXAM_MEDIA_ID = '44444444-4444-4444-8444-444444444444';
export const SEED_EXAM_MATH_ID = '55555555-5555-4555-8555-555555555555';
export const SEED_EXAM_ASSIGN_ID = '66666666-6666-4666-8666-666666666666';
const MATRIX_LSD = 'mx00002-aaaa-4bbb-cccc-ddddeeee0002';
const BANK_ENG = 'qb000003-aaaa-4bbb-cccc-ddddeeee0003';
const BANK_MEDIA = 'qb000004-aaaa-4bbb-cccc-ddddeeee0004';
const BANK_MATH = 'qb000005-aaaa-4bbb-cccc-ddddeeee0005';
const BANK_ASSIGN = 'qb000006-aaaa-4bbb-cccc-ddddeeee0006';

async function upsertDef(def: {
  id: string;
  code: string;
  title: string;
  durationMinutes: number;
  totalQuestions: number;
  examCoreBankId?: string | null;
  examCoreMatrixId?: string | null;
}) {
  const { id, ...rest } = def;
  // maxAttempt = 5: cho phép thi lại nhiều lần khi DEMO/test.
  await prisma.examDefinition.upsert({
    where: { id },
    update: { ...rest, showResult: true, maxAttempt: 5 },
    create: {
      id,
      sourceSystem: 'SEED',
      showResult: true,
      maxAttempt: 5,
      ...rest,
    },
  });
}

async function main() {
  // Đề mock nội bộ (CS101) — dùng khi EXAM_SOURCE=mock.
  await upsertDef({
    id: SEED_EXAM_DEF_ID,
    code: 'CS101-CK-HK2-2025',
    title: 'Cơ sở lập trình (CS101) — Thi cuối kỳ HK2',
    durationMinutes: 60,
    totalQuestions: 4,
  });

  // Đề RÚT TỪ MA TRẬN Lịch sử Đảng (10 câu) — examCoreMatrixId.
  await upsertDef({
    id: SEED_EXAM_LSD_ID,
    code: 'PH1020-CK-HK2-2025',
    title: 'Lịch sử Đảng — Thi cuối kỳ (rút từ ma trận)',
    durationMinutes: 30,
    totalQuestions: 10,
    examCoreMatrixId: MATRIX_LSD,
  });

  // Đề lấy CẢ BANK Tiếng Anh (15 câu) — examCoreBankId.
  await upsertDef({
    id: SEED_EXAM_ENG_ID,
    code: 'EN1030-CK-HK2-2025',
    title: 'Tiếng Anh cơ bản — Thi cuối kỳ',
    durationMinutes: 30,
    totalQuestions: 15,
    examCoreBankId: BANK_ENG,
  });

  // Đề lấy CẢ BANK Minh hoạ Hình/Video (12 câu) — examCoreBankId.
  await upsertDef({
    id: SEED_EXAM_MEDIA_ID,
    code: 'GE1040-CK-HK2-2025',
    title: 'Kiến thức tổng hợp (hình/video) — Thi cuối kỳ',
    durationMinutes: 25,
    totalQuestions: 12,
    examCoreBankId: BANK_MEDIA,
  });

  // Đề TOÁN (14 câu: công thức KaTeX + điền khuyết/điền giá trị) — để test.
  await upsertDef({
    id: SEED_EXAM_MATH_ID,
    code: 'MA1050-CK-HK2-2025',
    title: 'Toán cao cấp — Thi thử (công thức + điền khuyết)',
    durationMinutes: 30,
    totalQuestions: 15,
    examCoreBankId: BANK_MATH,
  });

  // Đề VẬN DỤNG (đối sánh / sắp thứ tự / phân loại) — 3 câu.
  await upsertDef({
    id: SEED_EXAM_ASSIGN_ID,
    code: 'VD1060-CK-HK2-2025',
    title: 'Vận dụng — Đối sánh / Sắp thứ tự / Phân loại',
    durationMinutes: 20,
    totalQuestions: 3,
    examCoreBankId: BANK_ASSIGN,
  });

  console.log('[seed] 6 ExamDefinition đã sẵn sàng (1 mock + 5 exam-core).');

  // ── Phân hệ LỊCH THI: Exam → ExamPeriod → ExamRoom + ExamSession(↔đề) ──────
  await seedScheduling();
}

/** ID cố định cho phân hệ lịch thi (idempotent). */
const SCHED_EXAM_ID = 'a1000000-0000-4000-8000-000000000001';
const SCHED_PERIOD_ID = 'b1000000-0000-4000-8000-000000000001';
const ROOMS = [
  { id: 'c1000000-0000-4000-8000-000000000001', code: 'PM1', name: 'Phòng Máy 1', capacity: 40, location: 'Tầng 1 — Nhà A' },
  { id: 'c1000000-0000-4000-8000-000000000002', code: 'PM2', name: 'Phòng Máy 2', capacity: 40, location: 'Tầng 2 — Nhà A' },
  { id: 'c1000000-0000-4000-8000-000000000003', code: 'PM3', name: 'Phòng Máy 3', capacity: 35, location: 'Tầng 2 — Nhà B' },
  { id: 'c1000000-0000-4000-8000-000000000004', code: 'GD-A', name: 'Giảng đường A', capacity: 80, location: 'Nhà A' },
];
// Mỗi ExamDefinition seed -> 1 ca thi (ExamSession) + liên kết SessionExam.
const SESSIONS: Array<{
  id: string;
  defId: string;
  code: string;
  name: string;
  durationMinutes: number;
  shift: number;
}> = [
  { id: 'd1000000-0000-4000-8000-000000000001', defId: SEED_EXAM_DEF_ID, code: 'CA-CS101', name: 'Ca thi CS101 — Cơ sở lập trình', durationMinutes: 60, shift: 1 },
  { id: 'd1000000-0000-4000-8000-000000000002', defId: SEED_EXAM_LSD_ID, code: 'CA-PH1020', name: 'Ca thi PH1020 — Lịch sử Đảng', durationMinutes: 30, shift: 1 },
  { id: 'd1000000-0000-4000-8000-000000000003', defId: SEED_EXAM_ENG_ID, code: 'CA-EN1030', name: 'Ca thi EN1030 — Tiếng Anh', durationMinutes: 30, shift: 2 },
  { id: 'd1000000-0000-4000-8000-000000000004', defId: SEED_EXAM_MEDIA_ID, code: 'CA-GE1040', name: 'Ca thi GE1040 — Kiến thức tổng hợp', durationMinutes: 45, shift: 1 },
  { id: 'd1000000-0000-4000-8000-000000000005', defId: SEED_EXAM_MATH_ID, code: 'CA-MA1050', name: 'Ca thi MA1050 — Toán cao cấp', durationMinutes: 60, shift: 2 },
  { id: 'd1000000-0000-4000-8000-000000000006', defId: SEED_EXAM_ASSIGN_ID, code: 'CA-VD1060', name: 'Ca thi VD1060 — Vận dụng', durationMinutes: 20, shift: 1 },
];

async function seedScheduling() {
  await prisma.exam.upsert({
    where: { id: SCHED_EXAM_ID },
    update: {},
    create: {
      id: SCHED_EXAM_ID,
      code: 'KT-CK-HK2-2025',
      name: 'Kỳ thi Cuối kỳ — HK2 2025-2026',
      academicYear: '2025-2026',
      semester: 'HK2',
      startDate: new Date('2026-06-15T00:00:00Z'),
      endDate: new Date('2026-06-20T23:59:59Z'),
      status: 'ONGOING',
    },
  });

  await prisma.examPeriod.upsert({
    where: { id: SCHED_PERIOD_ID },
    update: {},
    create: {
      id: SCHED_PERIOD_ID,
      examId: SCHED_EXAM_ID,
      code: 'DOT-CK-HK2-2025',
      name: 'Đợt thi Cuối kỳ — HK2 2025-2026',
      startDate: new Date('2026-06-15T00:00:00Z'),
      endDate: new Date('2026-06-20T23:59:59Z'),
    },
  });

  for (const r of ROOMS) {
    await prisma.examRoom.upsert({
      where: { id: r.id },
      update: { name: r.name, capacity: r.capacity, location: r.location },
      create: { ...r },
    });
  }

  for (const s of SESSIONS) {
    // Ca 1 = 07:30, Ca 2 = 09:30 ngày 15/06/2026.
    const startHour = s.shift === 1 ? 7 : 9;
    const start = new Date(`2026-06-15T${String(startHour).padStart(2, '0')}:30:00Z`);
    const end = new Date(start.getTime() + s.durationMinutes * 60_000);
    await prisma.examSession.upsert({
      where: { id: s.id },
      update: { name: s.name, durationMinutes: s.durationMinutes },
      create: {
        id: s.id,
        periodId: SCHED_PERIOD_ID,
        code: s.code,
        name: s.name,
        examDate: new Date('2026-06-15T00:00:00Z'),
        startTime: start,
        endTime: end,
        durationMinutes: s.durationMinutes,
        status: 'SCHEDULED',
      },
    });
    await prisma.sessionExam.upsert({
      where: {
        sessionId_examDefinitionId: {
          sessionId: s.id,
          examDefinitionId: s.defId,
        },
      },
      update: {},
      create: { sessionId: s.id, examDefinitionId: s.defId },
    });
  }

  console.log(
    `[seed] Lịch thi: 1 kỳ + 1 đợt + ${ROOMS.length} phòng + ${SESSIONS.length} ca.`,
  );
}

main()
  .catch((e) => {
    console.error('[seed] lỗi:', e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
