import { toInternalQuestion, toInternalSchedule } from './exam-core.mapper';
import {
  FIXTURE_EXAM_TERMS,
  FIXTURE_QUESTIONS,
} from './fixtures/exam-core.fixtures';
import { ExamCoreQuestion } from './dto/exam-core.types';

/**
 * EPIC-21 — Mapper exam-core -> model nội bộ. Bảo đảm quy đổi đúng loại câu và
 * trích đáp án chuẩn để grading engine hiện có chấm được.
 */
const byId = (id: string): ExamCoreQuestion =>
  FIXTURE_QUESTIONS.find((q) => q.id === id)!;

describe('exam-core mapper — toInternalQuestion', () => {
  it('TRAC_NGHIEM 1 đáp án -> SINGLE_CHOICE + correctAnswer là key', () => {
    const q = toInternalQuestion(byId('q0000001-aaaa-4bbb-cccc-ddddeeee0001'));
    expect(q.type).toBe('SINGLE_CHOICE');
    expect(q.options.map((o) => o.key)).toEqual(['A', 'B', 'C', 'D']);
    expect(q.correctAnswer).toBe('B'); // 'int' ở order 2 -> key B
    expect(q.autoGradable).toBe(true);
  });

  it('TRAC_NGHIEM nhiều đáp án -> MULTIPLE_CHOICE + correctAnswer là mảng key', () => {
    const q = toInternalQuestion(byId('q0000002-aaaa-4bbb-cccc-ddddeeee0002'));
    expect(q.type).toBe('MULTIPLE_CHOICE');
    expect(q.correctAnswer).toEqual(['A', 'B', 'D']); // for/while/do...while
    expect(q.autoGradable).toBe(true);
  });

  it('DUNG_SAI -> TRUE_FALSE + correctAnswer "T"/"F" (khớp quy ước nội bộ)', () => {
    const q = toInternalQuestion(byId('q0000003-aaaa-4bbb-cccc-ddddeeee0003'));
    expect(q.type).toBe('TRUE_FALSE');
    expect(q.correctAnswer).toBe('T');
    expect(q.options.map((o) => o.key)).toEqual(['T', 'F']);
    expect(q.options[0].value).toBe('Đúng (True)');
    expect(q.autoGradable).toBe(true);
  });

  it('DIEN_KHUYET -> FILL_BLANK + correctAnswer = correctText (tự chấm)', () => {
    const q = toInternalQuestion({
      ...byId('q0000001-aaaa-4bbb-cccc-ddddeeee0001'),
      type: 'DIEN_KHUYET',
      options: [],
      correctText: 'Hà Nội|Ha Noi',
    });
    expect(q.type).toBe('FILL_BLANK');
    expect(q.correctAnswer).toBe('Hà Nội|Ha Noi');
    expect(q.autoGradable).toBe(true);
  });

  it('DOI_SANH -> MATCHING + items/targets/correctAnswer (gán mục→đích)', () => {
    const q = toInternalQuestion({
      ...byId('q0000001-aaaa-4bbb-cccc-ddddeeee0001'),
      type: 'DOI_SANH',
      options: [],
      assignItems: ['VN', 'JP'],
      assignTargets: ['Tokyo', 'Hà Nội'],
      assignCorrect: [1, 0],
    });
    expect(q.type).toBe('MATCHING');
    expect(q.items?.map((i) => i.key)).toEqual(['I1', 'I2']);
    expect(q.targets?.map((t) => t.value)).toEqual(['Tokyo', 'Hà Nội']);
    expect(q.correctAnswer).toBe('I1:T2,I2:T1');
    expect(q.autoGradable).toBe(true);
  });

  it('SAP_THU_TU/PHAN_LOAI -> ORDERING/CLASSIFY', () => {
    const ord = toInternalQuestion({
      ...byId('q0000001-aaaa-4bbb-cccc-ddddeeee0001'),
      type: 'SAP_THU_TU',
      options: [],
      assignItems: ['A', 'B'],
      assignTargets: ['B1', 'B2'],
      assignCorrect: [0, 1],
    });
    expect(ord.type).toBe('ORDERING');
    const cls = toInternalQuestion({
      ...byId('q0000001-aaaa-4bbb-cccc-ddddeeee0001'),
      type: 'PHAN_LOAI',
      options: [],
      assignItems: ['x'],
      assignTargets: ['G'],
      assignCorrect: [0],
    });
    expect(cls.type).toBe('CLASSIFY');
  });

  it('DIEN_GIA_TRI -> NUMERIC + correctAnswer = số', () => {
    const q = toInternalQuestion({
      ...byId('q0000001-aaaa-4bbb-cccc-ddddeeee0001'),
      type: 'DIEN_GIA_TRI',
      options: [],
      correctText: '20',
    });
    expect(q.type).toBe('NUMERIC');
    expect(q.correctAnswer).toBe('20');
    expect(q.autoGradable).toBe(true);
  });

  it('CHON_VUNG_ANH -> HOTSPOT + vùng đúng mã hoá vào correctAnswer + mediaType IMAGE', () => {
    const q = toInternalQuestion({
      ...byId('q0000001-aaaa-4bbb-cccc-ddddeeee0001'),
      type: 'CHON_VUNG_ANH',
      options: [],
      mediaUrl: 'https://x/flag.png',
      hotspotRects: [
        [0.1, 0.2, 0.3, 0.4],
        [0.5, 0.6, 0.7, 0.8],
      ],
    });
    expect(q.type).toBe('HOTSPOT');
    expect(q.mediaType).toBe('IMAGE');
    expect(q.correctAnswer).toBe('0.1,0.2,0.3,0.4;0.5,0.6,0.7,0.8');
    expect(q.autoGradable).toBe(true);
  });

  it('TU_LUAN -> ESSAY: không có đáp án, không tự chấm, giữ modelAnswer', () => {
    const q = toInternalQuestion(byId('q0000004-aaaa-4bbb-cccc-ddddeeee0004'));
    expect(q.type).toBe('ESSAY');
    expect(q.correctAnswer).toBeNull();
    expect(q.autoGradable).toBe(false);
    expect(q.modelAnswer).toContain('Con trỏ');
    expect(q.options).toEqual([]);
  });

  it('options được sắp theo order tăng dần (ổn định)', () => {
    const scrambled: ExamCoreQuestion = {
      ...byId('q0000001-aaaa-4bbb-cccc-ddddeeee0001'),
      options: [
        { content: 'D-opt', isCorrect: false, order: 4, keepOrder: false },
        { content: 'A-opt', isCorrect: true, order: 1, keepOrder: false },
      ],
    };
    const q = toInternalQuestion(scrambled);
    expect(q.options[0].value).toBe('A-opt');
    expect(q.correctAnswer).toBe('A');
  });
});

describe('exam-core mapper — media', () => {
  it('giữ nguyên mediaUrl + mediaType khi map (hình/video/audio)', () => {
    const media = FIXTURE_QUESTIONS.find((q) => q.mediaType === 'VIDEO')!;
    const q = toInternalQuestion(media);
    expect(q.mediaType).toBe('VIDEO');
    expect(q.mediaUrl).toBe(media.mediaUrl);
  });

  it('câu không có media -> mediaUrl/mediaType = null', () => {
    const plain = toInternalQuestion(
      byId('q0000001-aaaa-4bbb-cccc-ddddeeee0001'),
    );
    expect(plain.mediaUrl).toBeNull();
    expect(plain.mediaType).toBeNull();
  });
});

describe('exam-core fixtures — độ phong phú bộ đề', () => {
  it('có ≥40 câu, đủ 6 ngân hàng', () => {
    expect(FIXTURE_QUESTIONS.length).toBeGreaterThanOrEqual(40);
    const banks = new Set(FIXTURE_QUESTIONS.map((q) => q.bankId));
    expect(banks.size).toBe(6);
  });

  it('có câu kèm IMAGE, VIDEO và AUDIO', () => {
    const types = new Set(
      FIXTURE_QUESTIONS.map((q) => q.mediaType).filter(Boolean),
    );
    expect(types).toEqual(new Set(['IMAGE', 'VIDEO', 'AUDIO']));
  });

  it('có câu CHỌN VÙNG ẢNH (HOTSPOT) kèm vùng đúng + ảnh nền', () => {
    const hs = FIXTURE_QUESTIONS.filter((q) => q.type === 'CHON_VUNG_ANH');
    expect(hs.length).toBeGreaterThanOrEqual(1);
    for (const q of hs) {
      expect(q.mediaUrl).toBeTruthy();
      expect((q.hotspotRects ?? []).length).toBeGreaterThanOrEqual(1);
      // mỗi vùng là HCN chuẩn hoá [x1,y1,x2,y2] trong [0,1].
      for (const r of q.hotspotRects!) {
        expect(r).toHaveLength(4);
        expect(r.every((n) => n >= 0 && n <= 1)).toBe(true);
      }
    }
  });
});

describe('exam-core mapper — toInternalSchedule', () => {
  it('đợt thi DANG_MO -> isOpen=true', () => {
    const open = FIXTURE_EXAM_TERMS.find((t) => t.status === 'DANG_MO')!;
    expect(toInternalSchedule(open).isOpen).toBe(true);
  });
  it('đợt thi DA_DONG -> isOpen=false', () => {
    const closed = FIXTURE_EXAM_TERMS.find((t) => t.status === 'DA_DONG')!;
    const s = toInternalSchedule(closed);
    expect(s.isOpen).toBe(false);
    expect(s.examType).toBe('GIUA_KY');
  });
});
