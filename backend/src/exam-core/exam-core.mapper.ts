import {
  ExamCoreExamTerm,
  ExamCoreQuestion,
  ExamCoreQuestionOption,
} from './dto/exam-core.types';

/**
 * Quy đổi DTO exam-core (KT&ĐBCL) sang MODEL NỘI BỘ của hệ thi.
 * Giữ nguyên hợp đồng nội bộ (type SINGLE/MULTIPLE/TRUE_FALSE + options[].key +
 * correctAnswer) để TÁI DÙNG nguyên grading engine và snapshot AttemptQuestion.
 */

/** Loại câu nội bộ — trùng enum đang dùng trong mock-api/questions.json. */
export type InternalQuestionType =
  | 'SINGLE_CHOICE'
  | 'MULTIPLE_CHOICE'
  | 'TRUE_FALSE'
  | 'ESSAY'
  | 'FILL_BLANK'
  | 'NUMERIC'
  | 'MATCHING'
  | 'ORDERING'
  | 'CLASSIFY'
  | 'HOTSPOT';

/** Phương án — ĐÚNG shape nội bộ của hệ thi (mock-api/questions.json): {key,value}. */
export interface InternalQuestionOption {
  key: string; // A, B, C, D... (hoặc T/F cho đúng-sai)
  value: string;
}

/**
 * Câu hỏi nội bộ — KHỚP shape câu hỏi hiện có của hệ thi để cắm thẳng vào
 * grading + frontend mà KHÔNG sửa hai chỗ đó (KÈM correctAnswer; chỉ dùng để
 * snapshot, KHÔNG trả ra thí sinh — đã có cơ chế strip).
 */
export interface InternalQuestion {
  id: string;
  code: string;
  type: InternalQuestionType;
  content: string;
  mediaUrl: string | null;
  mediaType: 'IMAGE' | 'VIDEO' | 'AUDIO' | null;
  options: InternalQuestionOption[];
  /** Câu GÁN MỤC→ĐÍCH (MATCHING/ORDERING/CLASSIFY): mục cần gán + đích để chọn. */
  items?: InternalQuestionOption[];
  targets?: InternalQuestionOption[];
  /** SINGLE/TRUE_FALSE: chuỗi; MULTIPLE: mảng key; ESSAY: null (không tự chấm). */
  correctAnswer: string | string[] | null;
  difficulty: string;
  score: number;
  noShuffle: boolean;
  sectionId: string | null;
  cloCode: string | null;
  /** ESSAY mới có — đáp án mẫu để chấm tay. */
  modelAnswer: string | null;
  /** Có tự chấm được không (ESSAY = false). */
  autoGradable: boolean;
  sourceBankId: string;
}

/** Lịch thi nội bộ từ đợt thi exam-core. */
export interface InternalSchedule {
  id: string;
  code: string;
  name: string;
  examType: 'GIUA_KY' | 'CUOI_KY';
  status: 'DU_THAO' | 'DANG_MO' | 'DA_DONG';
  startDate: string;
  endDate: string;
  isOpen: boolean;
}

const OPTION_KEYS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function keyAt(index: number): string {
  return OPTION_KEYS[index] ?? `OPT${index + 1}`;
}

/** Gán key A,B,C... theo `order` tăng dần (ổn định, không phụ thuộc thứ tự mảng). */
function buildOptions(raw: ExamCoreQuestionOption[]): {
  options: InternalQuestionOption[];
  correctKeys: string[];
} {
  const sorted = [...(raw ?? [])].sort((a, b) => a.order - b.order);
  const options: InternalQuestionOption[] = [];
  const correctKeys: string[] = [];
  sorted.forEach((o, i) => {
    const key = keyAt(i);
    options.push({ key, value: o.content });
    if (o.isCorrect) correctKeys.push(key);
  });
  return { options, correctKeys };
}

/** Map MỘT câu hỏi exam-core sang model nội bộ (kèm đáp án để chấm). */
export function toInternalQuestion(q: ExamCoreQuestion): InternalQuestion {
  const base = {
    id: q.id,
    code: q.code,
    content: q.content,
    mediaUrl: q.mediaUrl ?? null,
    mediaType: q.mediaType ?? null,
    difficulty: q.difficulty,
    score: q.score ?? 1,
    noShuffle: q.noShuffle ?? false,
    sectionId: q.sectionId ?? null,
    cloCode: q.cloCode ?? null,
    modelAnswer: null as string | null,
    sourceBankId: q.bankId,
  };

  if (q.type === 'DUNG_SAI') {
    // Theo quy ước nội bộ: key T/F (khớp grading + render Đúng/Sai của hệ thi).
    return {
      ...base,
      type: 'TRUE_FALSE',
      options: [
        { key: 'T', value: 'Đúng (True)' },
        { key: 'F', value: 'Sai (False)' },
      ],
      correctAnswer: q.trueFalseAnswer ? 'T' : 'F',
      autoGradable: true,
    };
  }

  if (q.type === 'TU_LUAN') {
    return {
      ...base,
      type: 'ESSAY',
      options: [],
      correctAnswer: null,
      modelAnswer: q.modelAnswer ?? null,
      autoGradable: false,
    };
  }

  if (q.type === 'DIEN_KHUYET' || q.type === 'DIEN_GIA_TRI') {
    // Nhập text/số — tự chấm bằng so khớp (xem answerCredit ở attempts).
    return {
      ...base,
      type: q.type === 'DIEN_GIA_TRI' ? 'NUMERIC' : 'FILL_BLANK',
      options: [],
      correctAnswer: q.correctText ?? '',
      autoGradable: true,
    };
  }

  if (
    q.type === 'DOI_SANH' ||
    q.type === 'SAP_THU_TU' ||
    q.type === 'PHAN_LOAI'
  ) {
    // GÁN MỤC→ĐÍCH: mỗi mục I{i} có 1 đích đúng T{assignCorrect[i]+1}.
    const labels = q.assignItems ?? [];
    const items = labels.map((value, i) => ({ key: `I${i + 1}`, value }));
    const targets = (q.assignTargets ?? []).map((value, i) => ({
      key: `T${i + 1}`,
      value,
    }));
    const correctAnswer = labels
      .map((_, i) => `I${i + 1}:T${(q.assignCorrect?.[i] ?? 0) + 1}`)
      .join(',');
    const type =
      q.type === 'DOI_SANH'
        ? 'MATCHING'
        : q.type === 'SAP_THU_TU'
          ? 'ORDERING'
          : 'CLASSIFY';
    return {
      ...base,
      type,
      options: [],
      items,
      targets,
      correctAnswer,
      autoGradable: true,
    };
  }

  if (q.type === 'CHON_VUNG_ANH') {
    // CHỌN VÙNG ẢNH: vùng đúng = các hình chữ nhật chuẩn hoá, mã hoá vào
    // correctAnswer dạng "x1,y1,x2,y2;x1,y1,x2,y2" (đã strip trước khi gửi SV).
    const rects = q.hotspotRects ?? [];
    return {
      ...base,
      type: 'HOTSPOT',
      options: [],
      mediaType: 'IMAGE',
      correctAnswer: rects.map((r) => r.join(',')).join(';'),
      autoGradable: true,
    };
  }

  // TRAC_NGHIEM: 1 đáp án đúng -> SINGLE; nhiều -> MULTIPLE.
  const { options, correctKeys } = buildOptions(q.options);
  const isMultiple = correctKeys.length > 1;
  return {
    ...base,
    type: isMultiple ? 'MULTIPLE_CHOICE' : 'SINGLE_CHOICE',
    options,
    correctAnswer: isMultiple ? correctKeys : (correctKeys[0] ?? ''),
    autoGradable: true,
  };
}

/** Nhóm loại câu nội bộ về loại exam-core (để khớp ô ma trận questionType). */
export function internalTypeToExamCore(
  type: InternalQuestionType,
):
  | 'TRAC_NGHIEM'
  | 'DUNG_SAI'
  | 'TU_LUAN'
  | 'DIEN_KHUYET'
  | 'DIEN_GIA_TRI'
  | 'DOI_SANH'
  | 'SAP_THU_TU'
  | 'PHAN_LOAI'
  | 'CHON_VUNG_ANH' {
  if (type === 'TRUE_FALSE') return 'DUNG_SAI';
  if (type === 'ESSAY') return 'TU_LUAN';
  if (type === 'FILL_BLANK') return 'DIEN_KHUYET';
  if (type === 'NUMERIC') return 'DIEN_GIA_TRI';
  if (type === 'MATCHING') return 'DOI_SANH';
  if (type === 'ORDERING') return 'SAP_THU_TU';
  if (type === 'CLASSIFY') return 'PHAN_LOAI';
  if (type === 'HOTSPOT') return 'CHON_VUNG_ANH';
  return 'TRAC_NGHIEM'; // SINGLE_CHOICE | MULTIPLE_CHOICE
}

/** Map đợt thi exam-core sang lịch thi nội bộ. */
export function toInternalSchedule(t: ExamCoreExamTerm): InternalSchedule {
  return {
    id: t.id,
    code: t.code,
    name: t.name,
    examType: t.examType,
    status: t.status,
    startDate: t.startDate,
    endDate: t.endDate,
    isOpen: t.status === 'DANG_MO',
  };
}
