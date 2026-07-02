import axios from 'axios';

// Normalize baseURL so it always ends with exactly one `/api/v1`, regardless of
// whether NEXT_PUBLIC_API_URL is set with or without that suffix (Docker passes
// it WITHOUT the suffix, local defaults include it).
const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001')
  .replace(/\/+$/, '')
  .replace(/\/api\/v1$/, '');

const api = axios.create({
  baseURL: `${base}/api/v1`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// JWT interceptor
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ── US-005 / FR-P-001: Pre-exam device check ─────────────────────────────────

export interface DeviceCheckPayload {
  browserCompatible: boolean;
  audioFunctional: boolean;
  pingStable: boolean;
}

export interface DeviceCheckResult {
  passed: boolean;
  checks: Record<string, boolean>;
}

/**
 * POST /exams/:examId/check-device → backend validates the device self-report.
 * Returns `{ passed, checks }` (inner `data`). 401 nếu chưa auth.
 */
export async function checkDevice(
  examId: string,
  payload: DeviceCheckPayload
): Promise<DeviceCheckResult> {
  const res = await api.post(`/exams/${examId}/check-device`, payload);
  return res.data.data;
}

// ── EPIC-13: Exam attempt / auto-save & recovery API ─────────────────────────
// Backend wraps responses as { statusCode, code, message, data }; callers want
// the inner `data`, hence `res.data.data`.

export interface StartExamResult {
  attemptId: string;
  startedAt: string;
  remainingSeconds: number;
  status: string;
  recovered: boolean;
}

export type QuestionType =
  | 'SINGLE_CHOICE'
  | 'MULTIPLE_CHOICE'
  | 'TRUE_FALSE'
  | 'FILL_BLANK'
  | 'NUMERIC'
  | 'ESSAY'
  | 'MATCHING'
  | 'ORDERING'
  | 'CLASSIFY'
  | 'HOTSPOT';

export interface ExamQuestion {
  id: string;
  type: QuestionType;
  content: string;
  options: { key: string; value: string }[];
  /** Câu gán mục→đích (matching/ordering/classify). */
  items?: { key: string; value: string }[];
  targets?: { key: string; value: string }[];
  difficulty?: string;
  mediaUrl?: string | null;
}

export interface AttemptAnswer {
  questionId: string;
  answerValue: string; // backend stores a CHUỖI, e.g. "B" or "A,C"
  answeredAt: string;
}

export interface AutosaveItem {
  questionId: string;
  answer: string; // CHUỖI
  timestamp: string; // ISO
}

export interface SubmitResult {
  attemptId: string;
  status: string;
  submittedAt: string;
}

/** POST /exams/:examId/start → returns (or recovers) the IN_PROGRESS attempt. */
export async function startExam(examId: string): Promise<StartExamResult> {
  const res = await api.post(`/exams/${examId}/start`);
  return res.data.data;
}

/**
 * GET /exams/:examId/questions → the question list for an exam.
 *
 * This endpoint is NOT wrapped in the standard envelope consistently: it may be
 * a passthrough `{ data: [...], meta }` OR the wrapped `{ data: { data: [...], meta } }`.
 * Resolve the array flexibly so both shapes work. `correctAnswer` is hidden by
 * the backend; `mediaType` is absent (derive it from `mediaUrl` at the caller).
 */
export async function getExamQuestions(examId: string): Promise<ExamQuestion[]> {
  const res = await api.get(`/exams/${examId}/questions`);
  return Array.isArray(res.data?.data)
    ? res.data.data
    : (res.data?.data?.data ?? []);
}

/** GET /attempts/:attemptId/answers → server-of-truth answers for recovery. */
export async function getAttemptAnswers(attemptId: string): Promise<AttemptAnswer[]> {
  const res = await api.get(`/attempts/${attemptId}/answers`);
  return res.data.data;
}

/** POST /attempts/:attemptId/answers → persist a single answer (CHUỖI). */
export async function saveAnswer(
  attemptId: string,
  questionId: string,
  answer: string
): Promise<unknown> {
  const res = await api.post(`/attempts/${attemptId}/answers`, { questionId, answer });
  return res.data.data;
}

/** POST /attempts/:attemptId/autosave → batch persist (offline-recovery sync). */
export async function autosaveAnswers(
  attemptId: string,
  items: AutosaveItem[]
): Promise<unknown> {
  const res = await api.post(`/attempts/${attemptId}/autosave`, { answers: items });
  return res.data.data;
}

/** POST /attempts/:attemptId/submit → finalize the attempt. */
export async function submitAttempt(attemptId: string): Promise<SubmitResult> {
  const res = await api.post(`/attempts/${attemptId}/submit`);
  return res.data.data;
}

// ── Exam result / review API ────────────────────────────────────────────────

export interface AttemptResult {
  score: number;
  correctAnswers: number;
  wrongAnswers: number;
  totalQuestions: number;
  published: boolean;
}

export interface ReviewItem {
  questionId: string;
  order: number;
  content: string;
  type: string;
  yourAnswer: string | null;
  correctAnswer: string;
  status: 'correct' | 'wrong' | 'skipped';
}

export interface ReviewSummary {
  total: number;
  answered: number;
  skipped: number;
}

export interface ReviewResponse {
  /**
   * Có cho phép sinh viên xem điểm/đáp án không (FR-L-003). Khi `false`, backend
   * trả `result = null` và `review = []` (chỉ báo hoàn thành, không lộ điểm).
   */
  showResult?: boolean;
  result: AttemptResult | null;
  review: ReviewItem[];
  summary: ReviewSummary;
}

export interface ExamDefinitionConfig {
  id: string;
  title: string;
  showResult: boolean;
  maxAttempt?: number;
  shuffleQuestions?: boolean;
  shuffleAnswers?: boolean;
  examCoreBankId?: string | null;
  examCoreMatrixId?: string | null;
}

/** Một đề thi trong danh sách vào thi (GET /exam-definitions). */
export interface ExamDefinitionListItem {
  id: string;
  code: string;
  title: string;
  durationMinutes: number;
  totalQuestions: number;
  showResult: boolean;
  examCoreBankId?: string | null;
  examCoreMatrixId?: string | null;
}

/** Tham số cấu hình đề (PATCH /exam-definitions/:id/config). */
export interface ExamConfigPatch {
  showResult?: boolean;
  maxAttempt?: number;
  shuffleQuestions?: boolean;
  shuffleAnswers?: boolean;
  examCoreBankId?: string;
  examCoreMatrixId?: string;
}

// ── Chấm tự luận (khảo thí) ──────────────────────────────────────────────────

export interface EssayAnswer {
  questionId: string;
  content: string;
  answer: string;
  manualCredit: number | null;
}
export interface EssayAttempt {
  attemptId: string;
  studentName: string;
  studentCode: string;
  essays: EssayAnswer[];
}

/** GET /exams/:id/essays → các bài tự luận cần chấm. */
export async function getExamEssays(
  examDefinitionId: string
): Promise<EssayAttempt[]> {
  const res = await api.get(`/exams/${examDefinitionId}/essays`);
  return Array.isArray(res.data?.data) ? res.data.data : [];
}

/** Một lượt làm bài của SV (cho khảo thí giám sát/đối soát). */
export interface ExamAttemptRow {
  attemptId: string;
  studentName: string;
  studentCode: string;
  status: string; // NOT_STARTED | IN_PROGRESS | SUBMITTED | EXPIRED
  startedAt: string | null;
  submittedAt: string | null;
  answeredCount: number;
  totalQuestions: number;
  score: number | null;
  correctAnswers: number | null;
  published: boolean;
}

/** GET /exams/:id/attempts → danh sách bài làm của một đề. */
export async function getExamAttempts(
  examDefinitionId: string
): Promise<ExamAttemptRow[]> {
  const res = await api.get(`/exams/${examDefinitionId}/attempts`);
  return Array.isArray(res.data?.data) ? res.data.data : [];
}

/** POST /attempts/:id/essay-grade → chấm 1 câu tự luận (credit 0..1). */
export async function gradeEssay(
  attemptId: string,
  questionId: string,
  credit: number
): Promise<{ manualCredit: number }> {
  const res = await api.post(`/attempts/${attemptId}/essay-grade`, {
    questionId,
    credit,
  });
  return res.data.data;
}

// ── EPIC-20: Báo cáo & thống kê ──────────────────────────────────────────────

export interface ScoreBucket {
  label: string;
  count: number;
}

export interface ReportOverviewItem {
  examDefinitionId: string;
  code: string | null;
  title: string | null;
  count: number;
  average: number;
  passRate: number;
}

export interface ExamReport {
  examDefinitionId: string;
  code: string | null;
  title: string | null;
  count: number;
  average: number;
  max: number;
  min: number;
  passCount: number;
  passRate: number;
  distribution: ScoreBucket[];
}

/** GET /reports/overview → tổng quan kết quả theo đề. */
export async function getReportOverview(): Promise<ReportOverviewItem[]> {
  const res = await api.get('/reports/overview');
  return Array.isArray(res.data?.data) ? res.data.data : [];
}

/** GET /reports/exams/:id → thống kê chi tiết một đề (gồm phổ điểm). */
export async function getExamReport(id: string): Promise<ExamReport> {
  const res = await api.get(`/reports/exams/${id}`);
  return res.data.data;
}

// ── Giám thị: theo dõi phòng thi (dữ liệu thật từ ExamAttempt) ───────────────

export interface InvigSession {
  id: string;
  code: string;
  title: string;
  totalStudents: number;
  inProgress: number;
  submitted: number;
  status: 'ONGOING' | 'COMPLETED' | 'UPCOMING';
}

export interface InvigStudent {
  id: string;
  fullName: string;
  studentCode: string;
  phone: string;
  machineId: string;
  ipAddress: string | null;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'EXPIRED' | string;
  answered: number;
  total: number;
  score: number | null;
  remainingSeconds: number | null;
}

/** GET /invigilator/sessions → các "ca thi" (đề có lượt làm bài). */
export async function getInvigilatorSessions(): Promise<InvigSession[]> {
  const res = await api.get('/invigilator/sessions');
  return Array.isArray(res.data?.data) ? res.data.data : [];
}

/** GET /invigilator/sessions/:id/students → sinh viên thật trong một đề. */
export async function getInvigilatorStudents(
  sessionId: string
): Promise<InvigStudent[]> {
  const res = await api.get(`/invigilator/sessions/${sessionId}/students`);
  return Array.isArray(res.data?.data) ? res.data.data : [];
}

// ── Lịch thi / Phân công giám thị (khảo thí) ─────────────────────────────────
export interface ExamRoom {
  id: string;
  code: string;
  name: string;
  capacity: number;
  location: string | null;
}
export interface Invigilator {
  id: string;
  fullName: string;
  email: string;
}
export interface SchedAssignment {
  id: string;
  roomId: string;
  roomName: string;
  roomCode: string;
  invigilatorId: string;
  invigilatorName: string;
}
export interface SchedSession {
  id: string;
  code: string;
  name: string;
  examDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: string;
  exam: { defId: string; code: string; title: string } | null;
  assignments: SchedAssignment[];
}

export async function getSchedulingSessions(): Promise<SchedSession[]> {
  const res = await api.get('/scheduling/sessions');
  return Array.isArray(res.data?.data) ? res.data.data : [];
}
export async function getExamRooms(): Promise<ExamRoom[]> {
  const res = await api.get('/scheduling/rooms');
  return Array.isArray(res.data?.data) ? res.data.data : [];
}
export async function createExamRoom(payload: {
  code: string;
  name: string;
  capacity: number;
  location?: string;
}): Promise<ExamRoom> {
  const res = await api.post('/scheduling/rooms', payload);
  return res.data.data;
}
export async function getInvigilators(): Promise<Invigilator[]> {
  const res = await api.get('/scheduling/invigilators');
  return Array.isArray(res.data?.data) ? res.data.data : [];
}
export async function assignInvigilator(
  sessionId: string,
  roomId: string,
  invigilatorId: string
): Promise<{ id: string }> {
  const res = await api.post(`/scheduling/sessions/${sessionId}/assign`, {
    roomId,
    invigilatorId,
  });
  return res.data.data;
}
export async function removeAssignment(id: string): Promise<{ ok: boolean }> {
  const res = await api.delete(`/scheduling/assignments/${id}`);
  return res.data.data;
}

/** Giám thị cấp lại mật khẩu (mật khẩu mới = mã SV). */
export async function resetStudentPassword(
  examId: string,
  studentCode: string
): Promise<{ ok: boolean; newPassword: string; exists: boolean }> {
  const res = await api.post(
    `/invigilator/sessions/${examId}/students/${encodeURIComponent(studentCode)}/reset-password`
  );
  return res.data.data;
}

/** Giám thị đổi máy / khôi phục phiên (gỡ ràng buộc máy lượt đang làm). */
export async function resetStudentSession(
  examId: string,
  studentCode: string
): Promise<{ ok: boolean; cleared: boolean }> {
  const res = await api.post(
    `/invigilator/sessions/${examId}/students/${encodeURIComponent(studentCode)}/reset-session`
  );
  return res.data.data;
}

/** Ma trận đề từ exam-core (GET /exam-core/matrices). */
export interface ExamCoreMatrix {
  id: string;
  code: string;
  name: string;
  bankId: string;
  courseNameText: string;
  examFormat: string;
  durationMinutes: number;
  totalPoints: number;
}

export interface ExamAttempt {
  id: string;
  status: string;
  answers?: unknown;
  [key: string]: unknown;
}

/**
 * GET /attempts/:attemptId/review → full graded result + per-question review.
 * Backend returns 403 if results are NOT yet published (student), 404 if there
 * is no result yet. Both are surfaced to the caller as axios errors.
 */
export async function getAttemptReview(
  attemptId: string
): Promise<ReviewResponse> {
  const res = await api.get(`/attempts/${attemptId}/review`);
  return res.data.data;
}

/** GET /attempts/:attemptId/review → only the graded result block (null nếu ẩn điểm). */
export async function getResult(attemptId: string): Promise<AttemptResult | null> {
  const res = await api.get(`/attempts/${attemptId}/review`);
  return res.data.data.result;
}

// ── EPIC: Cấu hình kỳ thi (FR-L-003) — Hiện/Ẩn kết quả ───────────────────────

/** GET /exam-definitions/:id → cấu hình đề (gồm cờ `showResult`). */
export async function getExamDefinition(
  id: string
): Promise<ExamDefinitionConfig> {
  const res = await api.get(`/exam-definitions/${id}`);
  return res.data.data;
}

/** GET /exam-definitions → danh sách đề để sinh viên vào thi. */
export async function getExamDefinitions(): Promise<ExamDefinitionListItem[]> {
  const res = await api.get('/exam-definitions');
  return Array.isArray(res.data?.data) ? res.data.data : [];
}

/** POST /exam-definitions → tạo đề thi mới (vai admin/khảo thí). */
export async function createExamDefinition(payload: {
  code: string;
  title: string;
  durationMinutes: number;
  totalQuestions: number;
}): Promise<ExamDefinitionListItem> {
  const res = await api.post('/exam-definitions', payload);
  return res.data.data;
}

/**
 * PATCH /exam-definitions/:id/config → cập nhật cấu hình đề (showResult, trộn,
 * số lần thi, liên kết nguồn exam-core…). Vai admin / khảo thí.
 * Truyền chuỗi rỗng cho examCoreBankId/examCoreMatrixId để GỠ liên kết.
 */
export async function setExamConfig(
  id: string,
  config: ExamConfigPatch
): Promise<ExamDefinitionConfig> {
  const res = await api.patch(`/exam-definitions/${id}/config`, config);
  return res.data.data;
}

/** GET /exam-core/matrices → danh sách ma trận đề (vai admin/khảo thí). */
export async function getExamCoreMatrices(): Promise<{
  source: string;
  items: ExamCoreMatrix[];
}> {
  const res = await api.get('/exam-core/matrices');
  return res.data.data;
}

/**
 * POST /exams/:examDefinitionId/results/publish → công bố kết quả (vai admin).
 * Trả về số kết quả đã công bố.
 */
export async function publishResults(
  examDefinitionId: string
): Promise<{ published: number }> {
  const res = await api.post(`/exams/${examDefinitionId}/results/publish`);
  return res.data.data;
}

/** POST /exams/:examDefinitionId/results/unpublish → gỡ công bố kết quả. */
export async function unpublishResults(
  examDefinitionId: string
): Promise<{ unpublished: number }> {
  const res = await api.post(`/exams/${examDefinitionId}/results/unpublish`);
  return res.data.data;
}

/** GET /exams/:examId/attempt → the student's latest attempt for the exam. */
export async function getExamAttempt(examId: string): Promise<ExamAttempt> {
  const res = await api.get(`/exams/${examId}/attempt`);
  return res.data.data;
}

// ── Auth (dev login) ─────────────────────────────────────────────────────────
// Endpoint dev-login nằm ở /api/auth/... (KHÔNG dưới /v1) nên gọi tuyệt đối.
export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  roles: string[];
  studentInfo?: unknown;
}

export async function devLogin(
  email: string
): Promise<{ user: AuthUser; accessToken: string }> {
  const res = await axios.post(`${base}/api/auth/dev/yopmail-test-user`, { email });
  const d = res.data.data;
  return { user: d.user, accessToken: d.token.accessToken };
}

/**
 * POST /api/auth/login — đăng nhập email + mật khẩu (contract-first).
 * Mock khi chưa có API auth thật; tự sang partner/login khi backend bật AUTH_SOURCE.
 */
export async function login(
  email: string,
  password: string
): Promise<{ user: AuthUser; accessToken: string }> {
  const res = await axios.post(`${base}/api/auth/login`, { email, password });
  const d = res.data.data;
  return { user: d.user, accessToken: d.token.accessToken };
}

export default api;
