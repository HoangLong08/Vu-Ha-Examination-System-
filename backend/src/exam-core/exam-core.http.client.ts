import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExamCoreClient, ListQuestionsParams } from './exam-core.client';
import {
  ExamCoreEnvelope,
  ExamCoreExamMatrix,
  ExamCoreExamTerm,
  ExamCoreMatrixCell,
  ExamCorePaginated,
  ExamCoreQuestion,
} from './dto/exam-core.types';

/**
 * Hiện thực HTTP THẬT — gọi API exam-core (KT&ĐBCL) bằng Bearer token.
 * Bật khi EXAM_SOURCE=exam-core và đã cấu hình EXAM_CORE_BASE_URL + EXAM_CORE_TOKEN.
 *
 * Đường dẫn lấy NGUYÊN theo Swagger kt-dbcl. Nếu hình dạng envelope danh sách của
 * API khác dự đoán, CHỈ phải sửa unwrap() ở một chỗ này.
 */
@Injectable()
export class ExamCoreHttpClient extends ExamCoreClient {
  private readonly logger = new Logger(ExamCoreHttpClient.name);
  private readonly baseUrl: string;
  private readonly token: string;

  constructor(private readonly config: ConfigService) {
    super();
    this.baseUrl = (
      this.config.get<string>('EXAM_CORE_BASE_URL') ??
      'https://dau-api-dev.coregenaihub.com'
    ).replace(/\/+$/, '');
    this.token = this.config.get<string>('EXAM_CORE_TOKEN') ?? '';
  }

  private async get<T>(
    path: string,
    query?: Record<string, string | number | undefined>,
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    for (const [k, v] of Object.entries(query ?? {})) {
      if (v !== undefined && v !== null && v !== '')
        url.searchParams.set(k, String(v));
    }
    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: 'application/json',
      },
    });
    if (!res.ok) {
      throw new Error(`exam-core ${res.status} ${res.statusText} cho ${path}`);
    }
    const body = (await res.json()) as ExamCoreEnvelope<T>;
    // API bọc payload trong envelope {statusCode, code, message, data,...}.
    return body.data;
  }

  /** Chuẩn hoá payload danh sách về dạng phân trang dù API trả mảng hay {items}. */
  private toPaginated<T>(
    data: unknown,
    page = 1,
    limit = 20,
  ): ExamCorePaginated<T> {
    if (Array.isArray(data)) {
      return { items: data as T[], total: data.length, page, limit };
    }
    const d = (data ?? {}) as Partial<ExamCorePaginated<T>>;
    return {
      items: d.items ?? [],
      total: d.total ?? d.items?.length ?? 0,
      page: d.page ?? page,
      limit: d.limit ?? limit,
    };
  }

  async listQuestions(
    params: ListQuestionsParams = {},
  ): Promise<ExamCorePaginated<ExamCoreQuestion>> {
    const data = await this.get<unknown>(
      '/api/exam-quality/question-bank/questions',
      {
        bankId: params.bankId,
        type: params.type,
        difficulty: params.difficulty,
        status: params.status,
        sectionId: params.sectionId,
        page: params.page,
        limit: params.limit,
      },
    );
    return this.toPaginated<ExamCoreQuestion>(data, params.page, params.limit);
  }

  async getQuestion(id: string): Promise<ExamCoreQuestion | null> {
    try {
      return await this.get<ExamCoreQuestion>(
        `/api/exam-quality/question-bank/questions/${id}`,
      );
    } catch (err) {
      this.logger.warn(`getQuestion(${id}) lỗi: ${(err as Error).message}`);
      return null;
    }
  }

  async listExamTerms(): Promise<ExamCorePaginated<ExamCoreExamTerm>> {
    const data = await this.get<unknown>(
      '/api/exam-quality/exam-core/exam-terms',
    );
    return this.toPaginated<ExamCoreExamTerm>(data);
  }

  async listMatrices(): Promise<ExamCorePaginated<ExamCoreExamMatrix>> {
    const data = await this.get<unknown>(
      '/api/exam-quality/exam-paper/matrices',
    );
    return this.toPaginated<ExamCoreExamMatrix>(data);
  }

  async getMatrix(id: string): Promise<ExamCoreExamMatrix | null> {
    try {
      return await this.get<ExamCoreExamMatrix>(
        `/api/exam-quality/exam-paper/matrices/${id}`,
      );
    } catch (err) {
      this.logger.warn(`getMatrix(${id}) lỗi: ${(err as Error).message}`);
      return null;
    }
  }

  async listMatrixCells(matrixId: string): Promise<ExamCoreMatrixCell[]> {
    // API trả MẢNG cells trực tiếp trong envelope.data.
    const data = await this.get<ExamCoreMatrixCell[]>(
      `/api/exam-quality/exam-paper/matrices/${matrixId}/cells`,
    );
    return Array.isArray(data) ? data : [];
  }
}
