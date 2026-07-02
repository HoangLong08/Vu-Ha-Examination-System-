/**
 * HỢP ĐỒNG API exam-core (KT&ĐBCL) — sao y schema thật từ
 * https://dau-api-dev.coregenaihub.com/docs/kt-dbcl (OpenAPI kt-dbcl-json).
 *
 * MỤC ĐÍCH: code theo đúng cấu trúc API thật để khi bên kia cấp token thì chỉ
 * cần lật cờ EXAM_SOURCE=exam-core là chạy LIVE, KHÔNG phải sửa mapper.
 * KHÔNG đổi tên field ở đây nếu chưa đối chiếu lại spec.
 */

/** Envelope chung của API (suy từ response lỗi 401: {statusCode,code,message,data,...}). */
export interface ExamCoreEnvelope<T> {
  statusCode: number;
  code: string;
  message: string;
  data: T;
  error?: string | null;
  timestamp?: string;
}

/** Khối phân trang (danh sách). `data` bọc trong envelope ở trên. */
export interface ExamCorePaginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

// ---- Ngân hàng câu hỏi: câu hỏi ----

// TRAC_NGHIEM/TU_LUAN/DUNG_SAI: 3 loại chính thức của exam-core.
// DIEN_KHUYET/DIEN_GIA_TRI: ta MỞ RỘNG (nhập text tự chấm) — exam-core sẽ bổ sung sau.
export type ExamCoreQuestionType =
  | 'TRAC_NGHIEM'
  | 'TU_LUAN'
  | 'DUNG_SAI'
  | 'DIEN_KHUYET'
  | 'DIEN_GIA_TRI'
  // Ta mở rộng (gán mục→đích): đối sánh / sắp thứ tự / phân loại.
  | 'DOI_SANH'
  | 'SAP_THU_TU'
  | 'PHAN_LOAI'
  // Ta mở rộng (đồ hoạ): chọn vùng trên ảnh — gộp Hot Area + Point and Shoot.
  | 'CHON_VUNG_ANH';
export type ExamCoreDifficulty =
  | 'TUONG_DOI_DE'
  | 'TRUNG_BINH'
  | 'TUONG_DOI_KHO'
  | 'KHO';
export type ExamCoreBloom =
  | 'REMEMBER'
  | 'UNDERSTAND'
  | 'APPLY'
  | 'ANALYZE'
  | 'EVALUATE'
  | 'CREATE';
export type ExamCoreQuestionStatus =
  | 'NHAP'
  | 'PHAN_BIEN'
  | 'HIEU_CHINH'
  | 'THAM_DINH'
  | 'NGHIEM_THU';

/** Một phương án trả lời (QuestionOptionDto). `isCorrect` LỘ đáp án — chỉ dùng nội bộ. */
export interface ExamCoreQuestionOption {
  content: string;
  isCorrect: boolean;
  order: number;
  keepOrder: boolean;
}

/** QuestionDto — chi tiết câu hỏi (GET /question-bank/questions/{id}). */
export interface ExamCoreQuestion {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  bankId: string;
  code: string;
  content: string;
  type: ExamCoreQuestionType;
  difficulty: ExamCoreDifficulty;
  cloCode?: string | null;
  bloomLevel?: ExamCoreBloom | null;
  cloId?: string | null;
  sectionId?: string | null;
  score: number;
  answerTimeMinutes?: number | null;
  noShuffle: boolean;
  /** Có với TRAC_NGHIEM; rỗng với DUNG_SAI/TU_LUAN. */
  options: ExamCoreQuestionOption[];
  /** Có với DUNG_SAI. */
  trueFalseAnswer?: boolean | null;
  /** Có với TU_LUAN — đáp án mẫu (KHÔNG tự chấm được). */
  modelAnswer?: string | null;
  /**
   * Đáp án đúng dạng text cho DIEN_KHUYET/DIEN_GIA_TRI (ta mở rộng). Nhiều đáp án
   * chấp nhận ngăn bằng `|`. DIEN_GIA_TRI so sánh dạng SỐ.
   */
  correctText?: string | null;
  /**
   * Câu GÁN MỤC→ĐÍCH (DOI_SANH/SAP_THU_TU/PHAN_LOAI — ta mở rộng):
   *  - assignItems: nhãn các mục (trái / cần xếp / cần phân loại)
   *  - assignTargets: nhãn đích (phải / vị trí / nhóm)
   *  - assignCorrect[i] = chỉ số (0-based) của đích đúng cho mục i
   */
  assignItems?: string[];
  assignTargets?: string[];
  assignCorrect?: number[];
  /**
   * Câu CHỌN VÙNG ẢNH (CHON_VUNG_ANH — ta mở rộng): mỗi vùng đúng là 1 hình chữ
   * nhật toạ độ CHUẨN HOÁ 0..1 `[x1, y1, x2, y2]` (góc trên-trái, dưới-phải) so
   * với kích thước ảnh. Thí sinh click vào ảnh; click rơi trong vùng = đúng.
   * Ảnh nền dùng chung trường `mediaUrl` (mediaType = IMAGE).
   */
  hotspotRects?: number[][];
  /**
   * MEDIA — CHƯA có trong spec kt-dbcl chính thức. Để sẵn (forward-compatible)
   * để hiển thị hình/video/audio kèm câu hỏi; map thẳng sang model nội bộ.
   * Khi API bổ sung trường media, chỉ cần khớp tên ở đây.
   */
  mediaUrl?: string | null;
  mediaType?: 'IMAGE' | 'VIDEO' | 'AUDIO' | null;
  status: ExamCoreQuestionStatus;
  createdByName?: string | null;
  lastReviewerName?: string | null;
  lastReviewNote?: string | null;
}

// ---- Tổ chức thi: đợt thi (lịch) ----

export type ExamTermType = 'GIUA_KY' | 'CUOI_KY';
export type ExamTermStatus = 'DU_THAO' | 'DANG_MO' | 'DA_DONG';

/** ExamTermDto — đợt thi (GET /exam-core/exam-terms). Đây là "lịch thi". */
export interface ExamCoreExamTerm {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  academicYearId: string;
  semesterId: string;
  code: string;
  name: string;
  examType: ExamTermType;
  status: ExamTermStatus;
  startDate: string;
  endDate: string;
}

// ---- Đề thi: ma trận đề ----

export type ExamMatrixFormat = 'TU_LUAN' | 'TRAC_NGHIEM' | 'HON_HOP';
export type ExamMatrixStatus =
  | 'NHAP'
  | 'CHO_DUYET'
  | 'DA_DUYET'
  | 'TU_CHOI'
  | 'KHOA';

/** ExamMatrixCellDto — một ô ma trận: yêu cầu rút N câu theo section/độ khó/loại. */
export interface ExamCoreMatrixCell {
  id: string;
  matrixId: string;
  sectionId?: string | null;
  sectionNameText?: string | null;
  difficulty: ExamCoreDifficulty;
  bloomLevel?: ExamCoreBloom | null;
  questionType: ExamCoreQuestionType;
  cloId?: string | null;
  cloCodeText?: string | null;
  questionCount: number;
  points: number;
  customPoints?: boolean;
  displayOrder: number;
  availableCount?: number;
}

/** ExamMatrixDto — ma trận đề (blueprint, KHÔNG phải đề đã rút câu). */
export interface ExamCoreExamMatrix {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  courseId: string;
  bankId: string;
  courseCodeText: string;
  courseNameText: string;
  code: string;
  name: string;
  examType: 'GIUA_KY' | 'CUOI_KY' | 'KHAC';
  examFormat: ExamMatrixFormat;
  durationMinutes: number;
  totalPoints: number;
  description?: string | null;
  status: ExamMatrixStatus;
  version: number;
  parentMatrixId?: string | null;
  rejectReason?: string | null;
}
