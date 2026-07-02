import { Injectable, Logger } from '@nestjs/common';
import { ExamCoreClient, ListQuestionsParams } from './exam-core.client';
import {
  ExamCoreExamMatrix,
  ExamCoreExamTerm,
  ExamCoreMatrixCell,
  ExamCorePaginated,
  ExamCoreQuestion,
} from './dto/exam-core.types';
import {
  FIXTURE_EXAM_TERMS,
  FIXTURE_MATRICES,
  FIXTURE_MATRIX_CELLS,
  FIXTURE_QUESTIONS,
} from './fixtures/exam-core.fixtures';

/**
 * Hiện thực MOCK — dùng khi CHƯA có token exam-core (bên kia đang phát triển).
 * Trả về ĐÚNG kiểu DTO như API thật, có lọc + phân trang cơ bản, để khi thay
 * bằng HTTP thật thì đầu gọi không phải đổi.
 */
@Injectable()
export class ExamCoreMockClient extends ExamCoreClient {
  private readonly logger = new Logger(ExamCoreMockClient.name);

  private paginate<T>(items: T[], page = 1, limit = 20): ExamCorePaginated<T> {
    const start = (page - 1) * limit;
    return {
      items: items.slice(start, start + limit),
      total: items.length,
      page,
      limit,
    };
  }

  listQuestions(
    params: ListQuestionsParams = {},
  ): Promise<ExamCorePaginated<ExamCoreQuestion>> {
    this.logger.debug(`[MOCK] listQuestions ${JSON.stringify(params)}`);
    let items = FIXTURE_QUESTIONS.filter((q) => !q.deletedAt);
    if (params.bankId) items = items.filter((q) => q.bankId === params.bankId);
    if (params.type) items = items.filter((q) => q.type === params.type);
    if (params.difficulty)
      items = items.filter((q) => q.difficulty === params.difficulty);
    if (params.status) items = items.filter((q) => q.status === params.status);
    if (params.sectionId)
      items = items.filter((q) => q.sectionId === params.sectionId);
    return Promise.resolve(this.paginate(items, params.page, params.limit));
  }

  getQuestion(id: string): Promise<ExamCoreQuestion | null> {
    return Promise.resolve(
      FIXTURE_QUESTIONS.find((q) => q.id === id && !q.deletedAt) ?? null,
    );
  }

  listExamTerms(): Promise<ExamCorePaginated<ExamCoreExamTerm>> {
    return Promise.resolve(
      this.paginate(FIXTURE_EXAM_TERMS.filter((t) => !t.deletedAt)),
    );
  }

  listMatrices(): Promise<ExamCorePaginated<ExamCoreExamMatrix>> {
    return Promise.resolve(
      this.paginate(FIXTURE_MATRICES.filter((m) => !m.deletedAt)),
    );
  }

  getMatrix(id: string): Promise<ExamCoreExamMatrix | null> {
    return Promise.resolve(
      FIXTURE_MATRICES.find((m) => m.id === id && !m.deletedAt) ?? null,
    );
  }

  listMatrixCells(matrixId: string): Promise<ExamCoreMatrixCell[]> {
    return Promise.resolve(
      FIXTURE_MATRIX_CELLS.filter((c) => c.matrixId === matrixId),
    );
  }
}
