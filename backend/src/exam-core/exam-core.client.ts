import {
  ExamCoreExamMatrix,
  ExamCoreExamTerm,
  ExamCoreMatrixCell,
  ExamCorePaginated,
  ExamCoreQuestion,
} from './dto/exam-core.types';

/** Tham số lọc danh sách câu hỏi (theo spec: bank/type/difficulty/status/section). */
export interface ListQuestionsParams {
  bankId?: string;
  type?: string;
  difficulty?: string;
  status?: string;
  sectionId?: string;
  page?: number;
  limit?: number;
}

/**
 * Cổng truy cập exam-core. CÓ 2 hiện thực:
 *  - ExamCoreMockClient: trả fixture (giống y API) — dùng khi CHƯA có token.
 *  - ExamCoreHttpClient: gọi HTTP thật — bật khi có token (EXAM_SOURCE=exam-core).
 * Cả hai trả về CÙNG kiểu DTO nên mapper/đầu gọi không phải biết nguồn nào.
 */
export abstract class ExamCoreClient {
  abstract listQuestions(
    params?: ListQuestionsParams,
  ): Promise<ExamCorePaginated<ExamCoreQuestion>>;

  abstract getQuestion(id: string): Promise<ExamCoreQuestion | null>;

  abstract listExamTerms(): Promise<ExamCorePaginated<ExamCoreExamTerm>>;

  abstract listMatrices(): Promise<ExamCorePaginated<ExamCoreExamMatrix>>;

  abstract getMatrix(id: string): Promise<ExamCoreExamMatrix | null>;

  abstract listMatrixCells(matrixId: string): Promise<ExamCoreMatrixCell[]>;
}
