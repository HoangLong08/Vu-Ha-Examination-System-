import { ConfigService } from '@nestjs/config';
import { ExamCoreService } from './exam-core.service';
import { ExamCoreMockClient } from './exam-core.mock.client';

/**
 * EPIC-21 — Facade ExamCoreService trên nguồn MOCK (chưa có token).
 * Trọng tâm: KHÔNG lộ đáp án ra ngoài + lọc/đếm đúng.
 */
function makeService(env: Record<string, string> = {}): ExamCoreService {
  const config = {
    get: (k: string) => env[k],
  } as unknown as ConfigService;
  return new ExamCoreService(new ExamCoreMockClient(), config);
}

describe('ExamCoreService (nguồn mock)', () => {
  it('source() mặc định = mock', () => {
    expect(makeService().source()).toBe('mock');
  });

  it('source() = exam-core khi EXAM_SOURCE=exam-core', () => {
    expect(makeService({ EXAM_SOURCE: 'exam-core' }).source()).toBe(
      'exam-core',
    );
  });

  it('getStudentSafeQuestions KHÔNG chứa correctAnswer/modelAnswer', async () => {
    const items = await makeService().getStudentSafeQuestions();
    expect(items.length).toBeGreaterThan(0);
    for (const q of items) {
      expect(q).not.toHaveProperty('correctAnswer');
      expect(q).not.toHaveProperty('modelAnswer');
    }
  });

  it('getQuestionsWithAnswers (nội bộ) CÓ correctAnswer', async () => {
    const items = await makeService().getQuestionsWithAnswers();
    const single = items.find((q) => q.type === 'SINGLE_CHOICE');
    expect(single?.correctAnswer).toBeTruthy();
  });

  it('lọc theo type', async () => {
    const items = await makeService().getStudentSafeQuestions({
      type: 'DUNG_SAI',
    });
    expect(items.every((q) => q.type === 'TRUE_FALSE')).toBe(true);
  });

  it('getSchedules trả đợt thi đã map', async () => {
    const list = await makeService().getSchedules();
    expect(list.length).toBeGreaterThan(0);
    expect(list[0]).toHaveProperty('isOpen');
  });

  it('getMatrices trả ma trận đề', async () => {
    const list = await makeService().getMatrices();
    expect(list[0]).toHaveProperty('durationMinutes');
  });

  describe('assembleFromMatrix — rút đề theo ô ma trận', () => {
    it('rút đúng số câu theo từng ô (Lịch sử Đảng: 2 dễ + 5 TB + 1 khó + 2 đúng/sai)', async () => {
      const picked = await makeService().assembleFromMatrix(
        'mx00002-aaaa-4bbb-cccc-ddddeeee0002',
      );
      // tổng theo ô = 2+5+1+2 = 10
      expect(picked).toHaveLength(10);
      // tất cả thuộc bank Lịch sử Đảng + tự chấm được
      expect(picked.every((q) => q.sourceBankId.endsWith('0002'))).toBe(true);
      expect(picked.every((q) => q.autoGradable)).toBe(true);
      // không trùng câu
      expect(new Set(picked.map((q) => q.id)).size).toBe(10);
      // có đủ trắc nghiệm + đúng/sai
      const types = new Set(picked.map((q) => q.type));
      expect(types.has('TRUE_FALSE')).toBe(true);
    });

    it('ma trận không tồn tại => []', async () => {
      expect(await makeService().assembleFromMatrix('không-có')).toEqual([]);
    });
  });
});
