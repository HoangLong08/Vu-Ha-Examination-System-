import {
  ExamCoreExamMatrix,
  ExamCoreExamTerm,
  ExamCoreMatrixCell,
  ExamCoreQuestion,
  ExamCoreQuestionOption,
} from '../dto/exam-core.types';

/**
 * DỮ LIỆU MẪU mô phỏng API exam-core (KT&ĐBCL) khi CHƯA có token.
 * Cấu trúc GIỐNG HỆT schema thật (xem dto/exam-core.types.ts).
 *
 * 4 ngân hàng cho phong phú:
 *   - qb…0001 Kỹ thuật lập trình C (giữ 4 câu gốc cho unit test)
 *   - qb…0002 Lịch sử Đảng Cộng sản Việt Nam
 *   - qb…0003 Tiếng Anh (có 1 câu nghe — AUDIO)
 *   - qb…0004 Minh hoạ Hình/Video (mỗi câu kèm media)
 */

const NOW = '2026-06-01T08:00:00.000Z';

export const BANK = {
  C: 'qb000001-aaaa-4bbb-cccc-ddddeeee0001',
  LSD: 'qb000002-aaaa-4bbb-cccc-ddddeeee0002',
  ENG: 'qb000003-aaaa-4bbb-cccc-ddddeeee0003',
  MEDIA: 'qb000004-aaaa-4bbb-cccc-ddddeeee0004',
  MATH: 'qb000005-aaaa-4bbb-cccc-ddddeeee0005',
  ASSIGN: 'qb000006-aaaa-4bbb-cccc-ddddeeee0006',
};

// --- ID sinh tự động (deterministic — KHÔNG dùng random để resume ổn định) ---
let _seq = 4; // 4 câu gốc đã dùng 0001..0004
function nextId(): string {
  _seq += 1;
  const a = String(_seq).padStart(7, '0');
  const b = String(_seq).padStart(4, '0');
  return `q${a}-aaaa-4bbb-cccc-ddddeeee${b}`;
}

type Extra = Partial<
  Pick<
    ExamCoreQuestion,
    | 'difficulty'
    | 'score'
    | 'cloCode'
    | 'bloomLevel'
    | 'mediaUrl'
    | 'mediaType'
    | 'noShuffle'
  >
>;

function base(
  bankId: string,
  code: string,
  content: string,
  type: ExamCoreQuestion['type'],
  extra: Extra = {},
): ExamCoreQuestion {
  return {
    id: nextId(),
    createdAt: NOW,
    updatedAt: NOW,
    deletedAt: null,
    bankId,
    code,
    content,
    type,
    difficulty: extra.difficulty ?? 'TRUNG_BINH',
    cloCode: extra.cloCode ?? null,
    bloomLevel: extra.bloomLevel ?? null,
    cloId: null,
    sectionId: null,
    score: extra.score ?? 1,
    answerTimeMinutes: 2,
    noShuffle: extra.noShuffle ?? false,
    options: [],
    trueFalseAnswer: null,
    modelAnswer: null,
    mediaUrl: extra.mediaUrl ?? null,
    mediaType: extra.mediaType ?? null,
    status: 'NGHIEM_THU',
    createdByName: 'Giảng viên',
    lastReviewerName: 'Hội đồng thẩm định',
    lastReviewNote: 'Đạt',
  };
}

/** Trắc nghiệm (1 hoặc nhiều đáp án — mapper tự nhận theo số đáp án đúng). */
function mcq(
  bankId: string,
  code: string,
  content: string,
  opts: Array<[string, boolean]>,
  extra: Extra = {},
): ExamCoreQuestion {
  const options: ExamCoreQuestionOption[] = opts.map(([c, isCorrect], i) => ({
    content: c,
    isCorrect,
    order: i + 1,
    keepOrder: false,
  }));
  return { ...base(bankId, code, content, 'TRAC_NGHIEM', extra), options };
}

/** Đúng/Sai. */
function tf(
  bankId: string,
  code: string,
  content: string,
  answer: boolean,
  extra: Extra = {},
): ExamCoreQuestion {
  return {
    ...base(bankId, code, content, 'DUNG_SAI', extra),
    trueFalseAnswer: answer,
  };
}

/** Điền khuyết — đáp án text (nhiều đáp án chấp nhận ngăn bằng `|`). */
function fill(
  bankId: string,
  code: string,
  content: string,
  correctText: string,
  extra: Extra = {},
): ExamCoreQuestion {
  return { ...base(bankId, code, content, 'DIEN_KHUYET', extra), correctText };
}

/** Điền giá trị — đáp án số. */
function numeric(
  bankId: string,
  code: string,
  content: string,
  correctText: string,
  extra: Extra = {},
): ExamCoreQuestion {
  return { ...base(bankId, code, content, 'DIEN_GIA_TRI', extra), correctText };
}

/** Tự luận — chỉ có đáp án mẫu (chấm tay). */
function essay(
  bankId: string,
  code: string,
  content: string,
  modelAnswer: string,
  extra: Extra = {},
): ExamCoreQuestion {
  return { ...base(bankId, code, content, 'TU_LUAN', extra), modelAnswer };
}

/**
 * Câu GÁN MỤC→ĐÍCH (đối sánh / sắp thứ tự / phân loại). correct[i] = chỉ số đích
 * đúng cho mục i.
 */
function assignQ(
  bankId: string,
  code: string,
  type: 'DOI_SANH' | 'SAP_THU_TU' | 'PHAN_LOAI',
  content: string,
  items: string[],
  targets: string[],
  correct: number[],
  extra: Extra = {},
): ExamCoreQuestion {
  return {
    ...base(bankId, code, content, type, extra),
    assignItems: items,
    assignTargets: targets,
    assignCorrect: correct,
  };
}

/**
 * Câu CHỌN VÙNG ẢNH (Hot Area / Point and Shoot). `rects` = các vùng đúng, mỗi
 * vùng `[x1,y1,x2,y2]` toạ độ CHUẨN HOÁ 0..1. Ảnh nền truyền qua `extra.mediaUrl`.
 */
function hotspot(
  bankId: string,
  code: string,
  content: string,
  imageUrl: string,
  rects: number[][],
  extra: Extra = {},
): ExamCoreQuestion {
  return {
    ...base(bankId, code, content, 'CHON_VUNG_ANH', {
      ...extra,
      mediaUrl: imageUrl,
      mediaType: 'IMAGE',
    }),
    hotspotRects: rects,
  };
}

// ============================================================
// 1) Kỹ thuật lập trình C — 4 câu GỐC (giữ nguyên ID cho unit test)
// ============================================================
const C_QUESTIONS: ExamCoreQuestion[] = [
  {
    id: 'q0000001-aaaa-4bbb-cccc-ddddeeee0001',
    createdAt: NOW,
    updatedAt: NOW,
    deletedAt: null,
    bankId: BANK.C,
    code: 'CH-0001',
    content:
      'Trong ngôn ngữ <b>C</b>, kiểu dữ liệu nào dưới đây thường chiếm <b>4 byte</b> (tức $2^{32}$ giá trị, công thức $n = 2^{8 \\times 4}$) trên hệ 32-bit?',
    type: 'TRAC_NGHIEM',
    difficulty: 'TUONG_DOI_DE',
    cloCode: 'CLO1',
    bloomLevel: 'REMEMBER',
    cloId: 'clo00001-1111-4aaa-bbbb-ccccdddd0001',
    sectionId: 'sec00001-1111-4aaa-bbbb-ccccdddd0001',
    score: 1,
    answerTimeMinutes: 2,
    noShuffle: false,
    options: [
      { content: 'char', isCorrect: false, order: 1, keepOrder: false },
      { content: 'int', isCorrect: true, order: 2, keepOrder: false },
      { content: 'short', isCorrect: false, order: 3, keepOrder: false },
      { content: 'bool', isCorrect: false, order: 4, keepOrder: false },
    ],
    trueFalseAnswer: null,
    modelAnswer: null,
    mediaUrl: null,
    mediaType: null,
    status: 'NGHIEM_THU',
    createdByName: 'Nguyễn Văn A',
    lastReviewerName: 'Trần Thị Mai',
    lastReviewNote: 'Đạt',
  },
  {
    id: 'q0000002-aaaa-4bbb-cccc-ddddeeee0002',
    createdAt: NOW,
    updatedAt: NOW,
    deletedAt: null,
    bankId: BANK.C,
    code: 'CH-0002',
    content:
      'Chọn TẤT CẢ các thành phần là cấu trúc điều khiển lặp trong C (chọn nhiều đáp án).',
    type: 'TRAC_NGHIEM',
    difficulty: 'TRUNG_BINH',
    cloCode: 'CLO2',
    bloomLevel: 'UNDERSTAND',
    cloId: 'clo00002-1111-4aaa-bbbb-ccccdddd0002',
    sectionId: 'sec00001-1111-4aaa-bbbb-ccccdddd0001',
    score: 2,
    answerTimeMinutes: 3,
    noShuffle: false,
    options: [
      { content: 'for', isCorrect: true, order: 1, keepOrder: false },
      { content: 'while', isCorrect: true, order: 2, keepOrder: false },
      { content: 'switch', isCorrect: false, order: 3, keepOrder: false },
      { content: 'do...while', isCorrect: true, order: 4, keepOrder: false },
    ],
    trueFalseAnswer: null,
    modelAnswer: null,
    mediaUrl: null,
    mediaType: null,
    status: 'NGHIEM_THU',
    createdByName: 'Nguyễn Văn A',
    lastReviewerName: 'Trần Thị Mai',
    lastReviewNote: 'Đạt',
  },
  {
    id: 'q0000003-aaaa-4bbb-cccc-ddddeeee0003',
    createdAt: NOW,
    updatedAt: NOW,
    deletedAt: null,
    bankId: BANK.C,
    code: 'CH-0003',
    content: 'Trong C, mảng được đánh chỉ số bắt đầu từ 0. Đúng hay sai?',
    type: 'DUNG_SAI',
    difficulty: 'TUONG_DOI_DE',
    cloCode: 'CLO1',
    bloomLevel: 'REMEMBER',
    cloId: 'clo00001-1111-4aaa-bbbb-ccccdddd0001',
    sectionId: 'sec00002-1111-4aaa-bbbb-ccccdddd0002',
    score: 1,
    answerTimeMinutes: 1,
    noShuffle: true,
    options: [],
    trueFalseAnswer: true,
    modelAnswer: null,
    mediaUrl: null,
    mediaType: null,
    status: 'NGHIEM_THU',
    createdByName: 'Nguyễn Văn A',
    lastReviewerName: 'Trần Thị Mai',
    lastReviewNote: 'Đạt',
  },
  {
    id: 'q0000004-aaaa-4bbb-cccc-ddddeeee0004',
    createdAt: NOW,
    updatedAt: NOW,
    deletedAt: null,
    bankId: BANK.C,
    code: 'CH-0004',
    content:
      'Trình bày sự khác nhau giữa con trỏ (pointer) và tham chiếu mảng trong C.',
    type: 'TU_LUAN',
    difficulty: 'KHO',
    cloCode: 'CLO3',
    bloomLevel: 'ANALYZE',
    cloId: 'clo00003-1111-4aaa-bbbb-ccccdddd0003',
    sectionId: 'sec00002-1111-4aaa-bbbb-ccccdddd0002',
    score: 3,
    answerTimeMinutes: 10,
    noShuffle: true,
    options: [],
    trueFalseAnswer: null,
    modelAnswer:
      'Con trỏ là biến lưu địa chỉ, có thể gán lại; tên mảng là hằng địa chỉ phần tử đầu, không gán lại được...',
    mediaUrl: null,
    mediaType: null,
    status: 'NGHIEM_THU',
    createdByName: 'Nguyễn Văn A',
    lastReviewerName: 'Trần Thị Mai',
    lastReviewNote: 'Đạt',
  },
];

// ============================================================
// 2) Lịch sử Đảng Cộng sản Việt Nam — 15 câu
// ============================================================
const LSD_QUESTIONS: ExamCoreQuestion[] = [
  mcq(
    BANK.LSD,
    'LSD-01',
    '<b>Đảng Cộng sản Việt Nam</b> được thành lập vào <i>năm</i> nào?',
    [
      ['1925', false],
      ['1930', true],
      ['1945', false],
      ['1954', false],
    ],
    { difficulty: 'TUONG_DOI_DE' },
  ),
  mcq(
    BANK.LSD,
    'LSD-02',
    'Hội nghị thành lập Đảng đầu năm 1930 diễn ra ở đâu?',
    [
      ['Hà Nội', false],
      ['Hương Cảng (Hồng Kông), Trung Quốc', true],
      ['Quảng Châu', false],
      ['Pác Bó, Cao Bằng', false],
    ],
  ),
  mcq(
    BANK.LSD,
    'LSD-03',
    'Ai là người chủ trì Hội nghị hợp nhất các tổ chức cộng sản thành lập Đảng?',
    [
      ['Trần Phú', false],
      ['Lê Hồng Phong', false],
      ['Nguyễn Ái Quốc', true],
      ['Hà Huy Tập', false],
    ],
  ),
  mcq(
    BANK.LSD,
    'LSD-04',
    'Cương lĩnh chính trị đầu tiên của Đảng do ai soạn thảo?',
    [
      ['Nguyễn Ái Quốc', true],
      ['Trần Phú', false],
      ['Lê Duẩn', false],
      ['Trường Chinh', false],
    ],
  ),
  mcq(
    BANK.LSD,
    'LSD-05',
    'Luận cương chính trị tháng 10/1930 gắn với tên tuổi đồng chí nào?',
    [
      ['Nguyễn Ái Quốc', false],
      ['Trần Phú', true],
      ['Lê Hồng Phong', false],
      ['Nguyễn Văn Cừ', false],
    ],
  ),
  mcq(
    BANK.LSD,
    'LSD-06',
    'Cao trào cách mạng 1930–1931 có đỉnh cao là phong trào nào?',
    [
      ['Xô viết Nghệ - Tĩnh', true],
      ['Đông Dương đại hội', false],
      ['Khởi nghĩa Nam Kỳ', false],
      ['Phong trào Đồng khởi', false],
    ],
  ),
  mcq(
    BANK.LSD,
    'LSD-07',
    'Đảng đổi tên thành "Đảng Cộng sản Đông Dương" vào thời điểm nào?',
    [
      ['Hội nghị thành lập Đảng 2/1930', false],
      ['Hội nghị Trung ương 10/1930', true],
      ['Đại hội I (1935)', false],
      ['Cách mạng Tháng Tám 1945', false],
    ],
  ),
  mcq(BANK.LSD, 'LSD-08', 'Mặt trận Việt Minh được thành lập năm nào?', [
    ['1936', false],
    ['1939', false],
    ['1941', true],
    ['1945', false],
  ]),
  mcq(
    BANK.LSD,
    'LSD-09',
    'Chọn các sự kiện thuộc giai đoạn 1939–1945 (chọn nhiều đáp án).',
    [
      ['Thành lập Mặt trận Việt Minh (1941)', true],
      ['Khởi nghĩa Nam Kỳ (1940)', true],
      ['Xô viết Nghệ - Tĩnh (1930)', false],
      ['Cách mạng Tháng Tám (1945)', true],
    ],
    { difficulty: 'TUONG_DOI_KHO' },
  ),
  mcq(
    BANK.LSD,
    'LSD-10',
    'Cách mạng Tháng Tám thành công vào năm nào?',
    [
      ['1930', false],
      ['1945', true],
      ['1954', false],
      ['1975', false],
    ],
    { difficulty: 'TUONG_DOI_DE' },
  ),
  mcq(
    BANK.LSD,
    'LSD-11',
    'Bản Tuyên ngôn Độc lập được Chủ tịch Hồ Chí Minh đọc ngày nào?',
    [
      ['19/8/1945', false],
      ['2/9/1945', true],
      ['7/5/1954', false],
      ['30/4/1975', false],
    ],
  ),
  mcq(
    BANK.LSD,
    'LSD-12',
    'Đường lối Đổi mới được Đảng ta khởi xướng tại Đại hội nào?',
    [
      ['Đại hội IV (1976)', false],
      ['Đại hội V (1982)', false],
      ['Đại hội VI (1986)', true],
      ['Đại hội VII (1991)', false],
    ],
  ),
  tf(
    BANK.LSD,
    'LSD-13',
    'Đảng Cộng sản Việt Nam ra đời là sự kết hợp giữa chủ nghĩa Mác - Lênin với phong trào công nhân và phong trào yêu nước. Đúng hay sai?',
    true,
    { difficulty: 'TUONG_DOI_DE' },
  ),
  tf(
    BANK.LSD,
    'LSD-14',
    'Luận cương chính trị tháng 10/1930 do Nguyễn Ái Quốc trực tiếp soạn thảo. Đúng hay sai?',
    false,
  ),
  tf(
    BANK.LSD,
    'LSD-15',
    'Chiến thắng Điện Biên Phủ năm 1954 buộc Pháp ký Hiệp định Genève. Đúng hay sai?',
    true,
  ),
];

// ============================================================
// 3) Tiếng Anh — 15 câu (có 1 câu nghe AUDIO)
// ============================================================
const AUDIO_URL = 'https://www.w3schools.com/html/horse.mp3';
const ENG_QUESTIONS: ExamCoreQuestion[] = [
  mcq(
    BANK.ENG,
    'ENG-01',
    'Choose the correct word: "She ___ to school every day."',
    [
      ['go', false],
      ['goes', true],
      ['going', false],
      ['gone', false],
    ],
    { difficulty: 'TUONG_DOI_DE' },
  ),
  mcq(BANK.ENG, 'ENG-02', 'Choose the past tense of "buy".', [
    ['buyed', false],
    ['bought', true],
    ['buys', false],
    ['buying', false],
  ]),
  mcq(BANK.ENG, 'ENG-03', 'Select the synonym of "happy".', [
    ['sad', false],
    ['joyful', true],
    ['angry', false],
    ['tired', false],
  ]),
  mcq(BANK.ENG, 'ENG-04', 'Fill in: "There ___ many books on the table."', [
    ['is', false],
    ['are', true],
    ['was', false],
    ['be', false],
  ]),
  mcq(
    BANK.ENG,
    'ENG-05',
    'Choose the correct article: "I saw ___ elephant at the zoo."',
    [
      ['a', false],
      ['an', true],
      ['the', false],
      ['(no article)', false],
    ],
  ),
  mcq(
    BANK.ENG,
    'ENG-06',
    'Which sentences are in the Present Perfect tense? (choose all that apply)',
    [
      ['I have finished my homework.', true],
      ['She has gone home.', true],
      ['They went to Paris last year.', false],
      ['He had eaten before I arrived.', false],
    ],
    { difficulty: 'TUONG_DOI_KHO' },
  ),
  mcq(
    BANK.ENG,
    'ENG-07',
    'Choose the correct comparative: "This box is ___ than that one."',
    [
      ['heavy', false],
      ['heavier', true],
      ['heaviest', false],
      ['more heavy', false],
    ],
  ),
  mcq(BANK.ENG, 'ENG-08', 'Select the antonym of "increase".', [
    ['decrease', true],
    ['grow', false],
    ['expand', false],
    ['raise', false],
  ]),
  mcq(
    BANK.ENG,
    'ENG-09',
    'Choose the correct preposition: "He is good ___ mathematics."',
    [
      ['in', false],
      ['at', true],
      ['on', false],
      ['for', false],
    ],
  ),
  mcq(BANK.ENG, 'ENG-10', 'Pick the correctly spelled word.', [
    ['recieve', false],
    ['receive', true],
    ['receeve', false],
    ['receve', false],
  ]),
  mcq(
    BANK.ENG,
    'ENG-11',
    'Choose the correct passive form: "The cake ___ by Mary."',
    [
      ['was baked', true],
      ['baked', false],
      ['is baking', false],
      ['has bake', false],
    ],
  ),
  mcq(BANK.ENG, 'ENG-12', 'Identify the modal verb of obligation.', [
    ['can', false],
    ['must', true],
    ['may', false],
    ['will', false],
  ]),
  mcq(
    BANK.ENG,
    'ENG-13',
    '[Listening] Listen to the audio and choose the animal you hear.',
    [
      ['Cat', false],
      ['Horse', true],
      ['Dog', false],
      ['Bird', false],
    ],
    { mediaUrl: AUDIO_URL, mediaType: 'AUDIO', difficulty: 'TRUNG_BINH' },
  ),
  tf(
    BANK.ENG,
    'ENG-14',
    'The plural of "child" is "childs". True or False?',
    false,
    { difficulty: 'TUONG_DOI_DE' },
  ),
  tf(
    BANK.ENG,
    'ENG-15',
    '"Better" is the comparative form of "good". True or False?',
    true,
  ),
];

// ============================================================
// 4) Minh hoạ Hình/Video — 12 câu (mỗi câu kèm media)
// ============================================================
const IMG_FLAG =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Flag_of_Vietnam.svg/320px-Flag_of_Vietnam.svg.png';
const IMG_MAP =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Vietnam_location_map.svg/320px-Vietnam_location_map.svg.png';
const IMG_DIAGRAM =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Binary_tree.svg/320px-Binary_tree.svg.png';
const VIDEO_BBB = 'https://www.w3schools.com/html/mov_bbb.mp4';
const VIDEO_FLOWER =
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';

const MEDIA_QUESTIONS: ExamCoreQuestion[] = [
  mcq(
    BANK.MEDIA,
    'MED-01',
    'Quan sát hình. Lá cờ trong hình là quốc kỳ của nước nào?',
    [
      ['Trung Quốc', false],
      ['Việt Nam', true],
      ['Lào', false],
      ['Thái Lan', false],
    ],
    { mediaUrl: IMG_FLAG, mediaType: 'IMAGE', difficulty: 'TUONG_DOI_DE' },
  ),
  mcq(
    BANK.MEDIA,
    'MED-02',
    'Bản đồ trong hình thể hiện quốc gia nào ở Đông Nam Á?',
    [
      ['Campuchia', false],
      ['Việt Nam', true],
      ['Myanmar', false],
      ['Philippines', false],
    ],
    { mediaUrl: IMG_MAP, mediaType: 'IMAGE' },
  ),
  mcq(
    BANK.MEDIA,
    'MED-03',
    'Sơ đồ trong hình mô tả cấu trúc dữ liệu nào?',
    [
      ['Danh sách liên kết', false],
      ['Cây nhị phân', true],
      ['Bảng băm', false],
      ['Hàng đợi', false],
    ],
    { mediaUrl: IMG_DIAGRAM, mediaType: 'IMAGE', difficulty: 'TRUNG_BINH' },
  ),
  tf(
    BANK.MEDIA,
    'MED-04',
    'Hình minh hoạ là một cây nhị phân tìm kiếm hợp lệ. Đúng hay sai?',
    false,
    { mediaUrl: IMG_DIAGRAM, mediaType: 'IMAGE' },
  ),
  mcq(
    BANK.MEDIA,
    'MED-05',
    'Xem video. Nội dung chính của đoạn video là gì?',
    [
      ['Một đoạn phim hoạt hình mẫu (Big Buck Bunny)', true],
      ['Bản tin thời sự', false],
      ['Video ca nhạc', false],
      ['Hướng dẫn nấu ăn', false],
    ],
    { mediaUrl: VIDEO_BBB, mediaType: 'VIDEO', difficulty: 'TUONG_DOI_DE' },
  ),
  mcq(
    BANK.MEDIA,
    'MED-06',
    'Xem video. Chủ thể xuất hiện trong đoạn video là gì?',
    [
      ['Bông hoa', true],
      ['Xe hơi', false],
      ['Toà nhà', false],
      ['Con tàu', false],
    ],
    { mediaUrl: VIDEO_FLOWER, mediaType: 'VIDEO' },
  ),
  mcq(
    BANK.MEDIA,
    'MED-07',
    'Dựa vào hình quốc kỳ, ngôi sao ở giữa có mấy cánh?',
    [
      ['4', false],
      ['5', true],
      ['6', false],
      ['7', false],
    ],
    { mediaUrl: IMG_FLAG, mediaType: 'IMAGE' },
  ),
  mcq(
    BANK.MEDIA,
    'MED-08',
    'Chọn các đặc điểm ĐÚNG của lá cờ trong hình (chọn nhiều đáp án).',
    [
      ['Nền màu đỏ', true],
      ['Ngôi sao màu vàng', true],
      ['Có hình mặt trăng', false],
      ['Ngôi sao 5 cánh', true],
    ],
    { mediaUrl: IMG_FLAG, mediaType: 'IMAGE', difficulty: 'TRUNG_BINH' },
  ),
  mcq(
    BANK.MEDIA,
    'MED-09',
    'Trên bản đồ, quốc gia này giáp biển nào ở phía Đông?',
    [
      ['Biển Đông', true],
      ['Ấn Độ Dương', false],
      ['Biển Đỏ', false],
      ['Địa Trung Hải', false],
    ],
    { mediaUrl: IMG_MAP, mediaType: 'IMAGE' },
  ),
  mcq(
    BANK.MEDIA,
    'MED-10',
    'Trong sơ đồ cây, nút không có nút con được gọi là gì?',
    [
      ['Nút gốc (root)', false],
      ['Nút lá (leaf)', true],
      ['Nút trong (internal)', false],
      ['Nút cha (parent)', false],
    ],
    { mediaUrl: IMG_DIAGRAM, mediaType: 'IMAGE' },
  ),
  tf(
    BANK.MEDIA,
    'MED-11',
    'Đoạn video minh hoạ là định dạng MP4. Đúng hay sai?',
    true,
    { mediaUrl: VIDEO_BBB, mediaType: 'VIDEO', difficulty: 'TUONG_DOI_DE' },
  ),
  mcq(
    BANK.MEDIA,
    'MED-12',
    'Quan sát hình quốc kỳ. Bố cục màu sắc chủ đạo là?',
    [
      ['Đỏ - Vàng', true],
      ['Xanh - Trắng', false],
      ['Đen - Trắng', false],
      ['Xanh - Đỏ', false],
    ],
    { mediaUrl: IMG_FLAG, mediaType: 'IMAGE' },
  ),
  // Hot Area — 1 vùng đúng: ngôi sao ở GIỮA lá cờ.
  hotspot(
    BANK.MEDIA,
    'MED-13',
    'Hot Area — Click vào <b>NGÔI SAO VÀNG</b> ở giữa lá cờ.',
    IMG_FLAG,
    [[0.36, 0.28, 0.64, 0.72]],
    { difficulty: 'TUONG_DOI_DE' },
  ),
  // Point and Shoot — nhiều vùng đúng: chỉ vào phần Bắc & Nam của bản đồ.
  hotspot(
    BANK.MEDIA,
    'MED-14',
    'Point and Shoot — Trên bản đồ, click vào <b>MIỀN BẮC</b> (phía trên) và <b>MIỀN NAM</b> (phía dưới).',
    IMG_MAP,
    [
      [0.2, 0.05, 0.85, 0.35],
      [0.25, 0.7, 0.7, 0.97],
    ],
    { difficulty: 'TRUNG_BINH' },
  ),
];

// ============================================================
// 5) Toán — 10 câu CÓ CÔNG THỨC (KaTeX: $...$ / $$...$$) để test hiển thị
// ============================================================
const MATH_QUESTIONS: ExamCoreQuestion[] = [
  mcq(
    BANK.MATH,
    'MATH-01',
    'Đạo hàm của hàm số $f(x)=x^2$ là gì?',
    [
      ["$f'(x)=2x$", true],
      ["$f'(x)=x$", false],
      ["$f'(x)=x^2$", false],
      ["$f'(x)=2$", false],
    ],
    { difficulty: 'TUONG_DOI_DE' },
  ),
  mcq(BANK.MATH, 'MATH-02', 'Nghiệm của phương trình $x^2 - 5x + 6 = 0$ là?', [
    ['$x=2$ và $x=3$', true],
    ['$x=1$ và $x=6$', false],
    ['$x=-2$ và $x=-3$', false],
    ['Vô nghiệm', false],
  ]),
  mcq(
    BANK.MATH,
    'MATH-03',
    'Tính tích phân $\\int_0^1 x\\,dx$.',
    [
      ['$\\dfrac{1}{2}$', true],
      ['$1$', false],
      ['$\\dfrac{1}{3}$', false],
      ['$2$', false],
    ],
    { difficulty: 'TRUNG_BINH' },
  ),
  mcq(
    BANK.MATH,
    'MATH-04',
    'Giới hạn $\\lim_{x\\to 0}\\dfrac{\\sin x}{x}$ bằng?',
    [
      ['$1$', true],
      ['$0$', false],
      ['$\\infty$', false],
      ['Không tồn tại', false],
    ],
  ),
  mcq(
    BANK.MATH,
    'MATH-05',
    'Đạo hàm của $g(x)=\\sin x$ là?',
    [
      ['$\\cos x$', true],
      ['$-\\cos x$', false],
      ['$-\\sin x$', false],
      ['$\\tan x$', false],
    ],
    { difficulty: 'TUONG_DOI_DE' },
  ),
  mcq(BANK.MATH, 'MATH-06', 'Giá trị của $\\sqrt{144} + 2^3$ là?', [
    ['$20$', true],
    ['$18$', false],
    ['$22$', false],
    ['$14$', false],
  ]),
  mcq(
    BANK.MATH,
    'MATH-07',
    'Công thức nghiệm phương trình bậc hai $ax^2+bx+c=0$ là?',
    [
      ['$x=\\dfrac{-b\\pm\\sqrt{b^2-4ac}}{2a}$', true],
      ['$x=\\dfrac{-b\\pm\\sqrt{b^2+4ac}}{2a}$', false],
      ['$x=\\dfrac{b\\pm\\sqrt{b^2-4ac}}{2a}$', false],
      ['$x=\\dfrac{-b\\pm\\sqrt{4ac-b^2}}{2a}$', false],
    ],
    { difficulty: 'TUONG_DOI_KHO' },
  ),
  mcq(
    BANK.MATH,
    'MATH-08',
    'Chọn các đẳng thức ĐÚNG (chọn nhiều đáp án).',
    [
      ['$\\sin^2\\theta + \\cos^2\\theta = 1$', true],
      ['$e^{i\\pi} + 1 = 0$', true],
      ['$\\log_a(xy) = \\log_a x \\cdot \\log_a y$', false],
      ['$\\dfrac{d}{dx}e^x = e^x$', true],
    ],
    { difficulty: 'TUONG_DOI_KHO' },
  ),
  tf(BANK.MATH, 'MATH-09', 'Đẳng thức $2^{10} = 1024$ là đúng hay sai?', true, {
    difficulty: 'TUONG_DOI_DE',
  }),
  tf(
    BANK.MATH,
    'MATH-10',
    'Khẳng định: $\\displaystyle\\sum_{k=1}^{n} k = \\dfrac{n(n+1)}{2}$. Đúng hay sai?',
    true,
  ),
  // Điền giá trị (số) + điền khuyết (text) — demo loại nhập text tự chấm.
  numeric(
    BANK.MATH,
    'MATH-11',
    'Điền giá trị: $\\sqrt{144} + 2^3 = $ ?',
    '20',
    {
      difficulty: 'TUONG_DOI_DE',
    },
  ),
  numeric(BANK.MATH, 'MATH-12', 'Điền giá trị giai thừa: $3! = $ ?', '6'),
  fill(
    BANK.MATH,
    'MATH-13',
    'Điền khuyết: Số $\\pi$ làm tròn 2 chữ số thập phân là ___',
    '3.14|3,14',
  ),
  fill(
    BANK.MATH,
    'MATH-14',
    'Điền khuyết: Đạo hàm của $\\ln x$ là ___ (viết dạng 1/x)',
    '1/x',
  ),
  essay(
    BANK.MATH,
    'MATH-15',
    "Tự luận: Trình bày ý nghĩa hình học của <b>đạo hàm</b> $f'(x_0)$ tại điểm $x_0$.",
    "Đạo hàm f'(x0) là hệ số góc của tiếp tuyến đồ thị y=f(x) tại điểm (x0, f(x0))…",
    { difficulty: 'KHO', score: 2 },
  ),
];

// ============================================================
// 6) Vận dụng — Đối sánh / Sắp thứ tự / Phân loại (gán mục→đích)
// ============================================================
const ASSIGN_QUESTIONS: ExamCoreQuestion[] = [
  assignQ(
    BANK.ASSIGN,
    'AS-01',
    'DOI_SANH',
    'Nối mỗi quốc gia với THỦ ĐÔ tương ứng:',
    ['Việt Nam', 'Nhật Bản', 'Pháp', 'Thái Lan'],
    ['Paris', 'Hà Nội', 'Tokyo', 'Bangkok'],
    [1, 2, 0, 3],
    { difficulty: 'TUONG_DOI_DE' },
  ),
  assignQ(
    BANK.ASSIGN,
    'AS-02',
    'SAP_THU_TU',
    'Sắp xếp ĐÚNG THỨ TỰ các bước vòng đời phát triển phần mềm:',
    ['Lập trình', 'Phân tích yêu cầu', 'Kiểm thử', 'Thiết kế'],
    ['Bước 1', 'Bước 2', 'Bước 3', 'Bước 4'],
    [2, 0, 3, 1], // Phân tích→1, Thiết kế→2, Lập trình→3, Kiểm thử→4
    { difficulty: 'TRUNG_BINH' },
  ),
  assignQ(
    BANK.ASSIGN,
    'AS-03',
    'PHAN_LOAI',
    'Phân loại mỗi thứ vào NHÓM đúng:',
    ['Python', 'HTML', 'SQL', 'C++'],
    ['Ngôn ngữ lập trình', 'Ngôn ngữ đánh dấu', 'Ngôn ngữ truy vấn'],
    [0, 1, 2, 0],
    { difficulty: 'TRUNG_BINH' },
  ),
];

export const FIXTURE_QUESTIONS: ExamCoreQuestion[] = [
  ...C_QUESTIONS,
  ...LSD_QUESTIONS,
  ...ENG_QUESTIONS,
  ...MEDIA_QUESTIONS,
  ...MATH_QUESTIONS,
  ...ASSIGN_QUESTIONS,
];

export const FIXTURE_EXAM_TERMS: ExamCoreExamTerm[] = [
  {
    id: 'et000001-aaaa-4bbb-cccc-ddddeeee0001',
    createdAt: NOW,
    updatedAt: NOW,
    deletedAt: null,
    academicYearId: 'ay000001-aaaa-4bbb-cccc-ddddeeee0001',
    semesterId: 'sm000001-aaaa-4bbb-cccc-ddddeeee0001',
    code: 'DT-2026-CK',
    name: 'Đợt thi Cuối kỳ — HK2 2025-2026',
    examType: 'CUOI_KY',
    status: 'DANG_MO',
    startDate: '2026-06-15T00:00:00.000Z',
    endDate: '2026-06-30T23:59:59.000Z',
  },
  {
    id: 'et000002-aaaa-4bbb-cccc-ddddeeee0002',
    createdAt: NOW,
    updatedAt: NOW,
    deletedAt: null,
    academicYearId: 'ay000001-aaaa-4bbb-cccc-ddddeeee0001',
    semesterId: 'sm000001-aaaa-4bbb-cccc-ddddeeee0001',
    code: 'DT-2026-GK',
    name: 'Đợt thi Giữa kỳ — HK2 2025-2026',
    examType: 'GIUA_KY',
    status: 'DA_DONG',
    startDate: '2026-04-10T00:00:00.000Z',
    endDate: '2026-04-20T23:59:59.000Z',
  },
];

function matrix(
  idTail: string,
  bankId: string,
  code: string,
  name: string,
  courseCodeText: string,
  courseNameText: string,
  examFormat: ExamCoreExamMatrix['examFormat'],
): ExamCoreExamMatrix {
  return {
    id: `mx0000${idTail}-aaaa-4bbb-cccc-ddddeeee000${idTail}`,
    createdAt: NOW,
    updatedAt: NOW,
    deletedAt: null,
    courseId: `crs0000${idTail}-aaaa-4bbb-cccc-ddddeeee000${idTail}`,
    bankId,
    courseCodeText,
    courseNameText,
    code,
    name,
    examType: 'CUOI_KY',
    examFormat,
    durationMinutes: 60,
    totalPoints: 10,
    description: 'Ma trận đề mẫu.',
    status: 'DA_DUYET',
    version: 1,
    parentMatrixId: null,
    rejectReason: null,
  };
}

export const FIXTURE_MATRICES: ExamCoreExamMatrix[] = [
  matrix(
    '1',
    BANK.C,
    'MT-IT1010-CK',
    'Ma trận Cuối kỳ — Lập trình C',
    'IT1010',
    'Kỹ thuật lập trình C',
    'TRAC_NGHIEM',
  ),
  matrix(
    '2',
    BANK.LSD,
    'MT-PH1020-CK',
    'Ma trận Cuối kỳ — Lịch sử Đảng',
    'PH1020',
    'Lịch sử Đảng Cộng sản Việt Nam',
    'TRAC_NGHIEM',
  ),
  matrix(
    '3',
    BANK.ENG,
    'MT-EN1030-CK',
    'Ma trận Cuối kỳ — Tiếng Anh',
    'EN1030',
    'Tiếng Anh cơ bản',
    'TRAC_NGHIEM',
  ),
  matrix(
    '4',
    BANK.MEDIA,
    'MT-GE1040-CK',
    'Ma trận Cuối kỳ — Minh hoạ Hình/Video',
    'GE1040',
    'Kiến thức tổng hợp (đa phương tiện)',
    'HON_HOP',
  ),
];

/** Mã ma trận tiện tham chiếu (khớp id sinh bởi matrix()). */
export const MATRIX_ID = {
  C: 'mx00001-aaaa-4bbb-cccc-ddddeeee0001',
  LSD: 'mx00002-aaaa-4bbb-cccc-ddddeeee0002',
  ENG: 'mx00003-aaaa-4bbb-cccc-ddddeeee0003',
  MEDIA: 'mx00004-aaaa-4bbb-cccc-ddddeeee0004',
};

function cell(
  idTail: string,
  matrixId: string,
  difficulty: ExamCoreMatrixCell['difficulty'],
  questionType: ExamCoreMatrixCell['questionType'],
  questionCount: number,
  points: number,
  displayOrder: number,
): ExamCoreMatrixCell {
  return {
    id: `mc0000${idTail}-aaaa-4bbb-cccc-ddddeeee000${idTail}`,
    matrixId,
    sectionId: null, // fixture không phân section -> rút theo độ khó + loại
    sectionNameText: null,
    difficulty,
    bloomLevel: null,
    questionType,
    cloId: null,
    cloCodeText: null,
    questionCount,
    points,
    customPoints: false,
    displayOrder,
  };
}

/**
 * Ô ma trận cho ma trận Lịch sử Đảng (MATRIX_ID.LSD) — rút 10 câu:
 *   2 dễ + 5 trung bình + 1 khó (trắc nghiệm) + 2 đúng/sai trung bình.
 * Phù hợp số câu sẵn có trong bank LSD.
 */
export const FIXTURE_MATRIX_CELLS: ExamCoreMatrixCell[] = [
  cell('1', MATRIX_ID.LSD, 'TUONG_DOI_DE', 'TRAC_NGHIEM', 2, 1, 1),
  cell('2', MATRIX_ID.LSD, 'TRUNG_BINH', 'TRAC_NGHIEM', 5, 1, 2),
  cell('3', MATRIX_ID.LSD, 'TUONG_DOI_KHO', 'TRAC_NGHIEM', 1, 2, 3),
  cell('4', MATRIX_ID.LSD, 'TRUNG_BINH', 'DUNG_SAI', 2, 1, 4),
];
