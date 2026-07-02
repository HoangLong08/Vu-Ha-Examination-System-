import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExamCoreClient, ListQuestionsParams } from './exam-core.client';
import {
  InternalQuestion,
  InternalSchedule,
  internalTypeToExamCore,
  toInternalQuestion,
  toInternalSchedule,
} from './exam-core.mapper';
import { ExamCoreExamMatrix, ExamCoreMatrixCell } from './dto/exam-core.types';

/** Câu hỏi đã bỏ đáp án — an toàn để trả cho thí sinh/preview. */
export type StudentSafeQuestion = Omit<
  InternalQuestion,
  'correctAnswer' | 'modelAnswer'
>;

/**
 * Facade exam-core dùng cho phần còn lại của hệ thi. Che nguồn dữ liệu (mock/HTTP)
 * sau ExamCoreClient + áp mapper sang model nội bộ.
 */
@Injectable()
export class ExamCoreService {
  private readonly logger = new Logger(ExamCoreService.name);

  constructor(
    private readonly client: ExamCoreClient,
    private readonly config: ConfigService,
  ) {}

  /** Nguồn đang dùng (để chẩn đoán/hiển thị). */
  source(): 'mock' | 'exam-core' {
    return this.config.get<string>('EXAM_SOURCE') === 'exam-core'
      ? 'exam-core'
      : 'mock';
  }

  /** Câu hỏi KÈM đáp án — chỉ dùng nội bộ để snapshot khi bắt đầu thi. */
  async getQuestionsWithAnswers(
    params?: ListQuestionsParams,
  ): Promise<InternalQuestion[]> {
    const page = await this.client.listQuestions(params);
    return page.items.map(toInternalQuestion);
  }

  /** Câu hỏi đã BỎ đáp án — an toàn cho thí sinh / màn preview. */
  async getStudentSafeQuestions(
    params?: ListQuestionsParams,
  ): Promise<StudentSafeQuestion[]> {
    const list = await this.getQuestionsWithAnswers(params);
    return list.map(stripAnswer);
  }

  /** Lịch thi (đợt thi). */
  async getSchedules(): Promise<InternalSchedule[]> {
    const page = await this.client.listExamTerms();
    return page.items.map(toInternalSchedule);
  }

  /** Ma trận đề (blueprint) — trả nguyên DTO (chưa có nhu cầu map nội bộ). */
  async getMatrices(): Promise<ExamCoreExamMatrix[]> {
    const page = await this.client.listMatrices();
    return page.items;
  }

  /**
   * RÚT ĐỀ TỪ MA TRẬN — với mỗi ô (section × độ khó × loại) lấy đúng `questionCount`
   * câu từ ngân hàng của ma trận, không trùng lặp giữa các ô. Trả về câu KÈM đáp án
   * (để snapshot). Nếu ô thiếu câu, lấy hết phần có và GHI LOG (không cắt im lặng).
   */
  async assembleFromMatrix(matrixId: string): Promise<InternalQuestion[]> {
    const matrix = await this.client.getMatrix(matrixId);
    if (!matrix) {
      this.logger.warn(`Không tìm thấy ma trận ${matrixId}`);
      return [];
    }
    const cells = await this.client.listMatrixCells(matrixId);
    const pool = await this.getQuestionsWithAnswers({ bankId: matrix.bankId });

    const used = new Set<string>();
    const picked: InternalQuestion[] = [];
    const ordered = [...cells].sort((a, b) => a.displayOrder - b.displayOrder);

    for (const c of ordered) {
      const matches = pool.filter(
        (q) => !used.has(q.id) && this.matchCell(q, c),
      );
      const take = matches.slice(0, c.questionCount);
      if (take.length < c.questionCount) {
        this.logger.warn(
          `Ô ma trận ${c.id} (${c.questionType}/${c.difficulty}) cần ${c.questionCount} câu nhưng chỉ có ${take.length}.`,
        );
      }
      for (const q of take) {
        used.add(q.id);
        picked.push(q);
      }
    }
    return picked;
  }

  private matchCell(q: InternalQuestion, c: ExamCoreMatrixCell): boolean {
    if (internalTypeToExamCore(q.type) !== c.questionType) return false;
    if (q.difficulty !== c.difficulty) return false;
    if (c.sectionId && q.sectionId !== c.sectionId) return false;
    return true;
  }
}

/** Bỏ mọi trường lộ đáp án khỏi câu hỏi. */
export function stripAnswer(q: InternalQuestion): StudentSafeQuestion {
  const { correctAnswer: _c, modelAnswer: _m, ...safe } = q;
  return safe;
}
