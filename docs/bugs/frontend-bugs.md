# Bug Tickets — FRONTEND (QC: CAIRA-DAU)

> Dự án: DAU Examination System
> Quy trình áp dụng: "Quy trình phát triển phần mềm CAIRA-DAU v1.0" — Mục 7.4 (Bug template), 7.5 (Severity), 7.6 (Sign-off), Bảng 5.1 (Min test/US).
> Nguồn phát hiện: QA Frontend — `frontend/src/components/exam/QuestionCard.test.tsx` (Vitest + Testing Library, 16/17 pass, 1 fail cố ý đánh dấu lỗ hổng câu hình ảnh).
> Build/commit: branch `main`, chưa commit.
> Ngày lập: 2026-06-12.

Cách chạy lại bộ test (dùng cho tất cả "Steps to reproduce" bên dưới):

```bash
cd frontend
npm test -- --run
```

Thứ tự ticket sắp theo Severity giảm dần: High → Medium → Low.

---

## BUG-FE-001 — [BUG] Câu hỏi dạng HÌNH ẢNH không hiển thị (component không render `<img>`)

| Trường | Giá trị |
|---|---|
| **Environment** | Local (dev), QA |
| **Severity** | **High** — chặn nghiệp vụ, không workaround ở tầng FE |
| **Linked User Story** | US-050 (Sinh viên xem hình ảnh trong câu hỏi) |
| **Build/commit hash** | branch `main`, chưa commit |
| **Attachments** | `frontend/src/components/exam/QuestionCard.test.tsx` (describe "QuestionCard - image question (KNOWN GAP - expected to fail)", dòng 195-206) |

**Mô tả:**
Interface `QuestionCardProps` (`frontend/src/components/exam/QuestionCard.tsx:10-19`) KHÔNG có field `mediaUrl` (hay bất kỳ field media nào). Thân component (dòng 60-132) chỉ render badge, số câu, content và options — không có thẻ `<img>`. Do đó câu hỏi có hình ảnh không thể hiển thị, sinh viên không xem được đề.

**Steps to reproduce:**
1. `cd frontend && npm test -- --run`
2. Quan sát test `renders an <img> when the question carries a media URL` (QuestionCard.test.tsx:196).
3. Test FAIL: `screen.queryByRole('img')` trả về `null` → không có `<img>` nào được render.

**Expected:** Khi câu hỏi có `mediaUrl`, component render một `<img>` với `src = mediaUrl` (kèm `alt` mô tả) để sinh viên xem được hình.

**Actual:** Props không có `mediaUrl`; component không bao giờ render `<img>`. Test đánh dấu gap business (cố ý fail).

---

## BUG-FE-002 — [BUG] Câu hỏi dạng VIDEO chưa được hỗ trợ trong QuestionCard

| Trường | Giá trị |
|---|---|
| **Environment** | Local (dev), QA |
| **Severity** | **High** — chặn nghiệp vụ làm bài với câu video |
| **Linked User Story** | US-051 (xem video trong câu hỏi); liên quan US-054 (video phát mượt) |
| **Build/commit hash** | branch `main`, chưa commit |
| **Attachments** | `frontend/src/components/exam/QuestionCard.tsx:10-19, 60-132` (không có field/element video) |

**Mô tả:**
Tương tự BUG-FE-001 nhưng cho media video. `QuestionCardProps` không có field video và component không render `<video>` / player. Câu hỏi video không thể trình bày.

**Steps to reproduce:**
1. Đọc `QuestionCard.tsx:10-19` → không có field video.
2. `cd frontend && npm test -- --run` → hiện chưa có test cho câu video (gap kép: thiếu cả implementation lẫn test).

**Expected:** Component render `<video>` (có controls) khi câu hỏi mang URL video, hỗ trợ US-051/US-054.

**Actual:** Không có field video, không render media. Chưa có test bao phủ.

---

## BUG-FE-003 — [BUG] Câu hỏi dạng ÂM THANH chưa được hỗ trợ trong QuestionCard

| Trường | Giá trị |
|---|---|
| **Environment** | Local (dev), QA |
| **Severity** | **Medium** — luồng phụ (listening); chưa rõ có workaround |
| **Linked User Story** | US-052 (nghe âm thanh trong câu hỏi) |
| **Build/commit hash** | branch `main`, chưa commit |
| **Attachments** | `frontend/src/components/exam/QuestionCard.tsx:10-19, 60-132` (không có field/element audio) |

**Mô tả:**
`QuestionCardProps` không có field audio; component không render `<audio>` player. Câu hỏi nghe (listening) không phát được.

**Steps to reproduce:**
1. Đọc `QuestionCard.tsx:10-19` → không có field audio.
2. `cd frontend && npm test -- --run` → chưa có test cho câu audio.

**Expected:** Component render `<audio controls>` khi câu hỏi mang URL audio, hỗ trợ US-052.

**Actual:** Không có field audio, không render media. Chưa có test bao phủ.

---

## BUG-FE-004 — [BUG] Component không tự ép single-selection cho SINGLE_CHOICE / TRUE_FALSE

| Trường | Giá trị |
|---|---|
| **Environment** | Local (dev), QA |
| **Severity** | **Medium** — có workaround (parent kiểm soát `selectedAnswers`); 1 sprint |
| **Linked User Story** | US-047 (Single Choice), US-049 (True/False) |
| **Build/commit hash** | branch `main`, chưa commit |
| **Attachments** | `frontend/src/components/exam/QuestionCard.test.tsx` (describe "selected answer highlighting", dòng 142-152) |

**Mô tả:**
Biến `isSingle` (`QuestionCard.tsx:58`) CHỈ dùng để đổi hình dạng indicator (tròn vs vuông) ở dòng 99-119; nó KHÔNG ràng buộc số lượng đáp án được chọn. Việc highlight phụ thuộc hoàn toàn vào prop `selectedAnswers` (dòng 85) do parent truyền. Nếu parent truyền nhiều key cho câu SINGLE_CHOICE/TRUE_FALSE, component sẽ vô tư highlight nhiều đáp án — vi phạm ràng buộc "một đáp án".

**Steps to reproduce:**
1. `cd frontend && npm test -- --run`.
2. Test hiện hành chỉ xác nhận highlight đúng theo `selectedAnswers` (dòng 143-151), không có rào chắn ở component cho trường hợp `selectedAnswers=['A','B']` với `type='SINGLE_CHOICE'`.
3. (Edge cần bổ sung) Render `<QuestionCard type="SINGLE_CHOICE" selectedAnswers={['A','B']} />` → cả A và B đều mang class selected → sai nghiệp vụ.

**Expected:** Với SINGLE_CHOICE/TRUE_FALSE, tại mọi thời điểm tối đa 1 đáp án được hiển thị "đã chọn" (component tự bảo vệ, không phụ thuộc parent).

**Actual:** Component highlight mọi key có trong `selectedAnswers`, không phân biệt loại câu → có thể highlight nhiều đáp án cho câu một-đáp-án.

---

## BUG-FE-005 — [BUG] Render nội dung câu hỏi bằng `dangerouslySetInnerHTML` — nguy cơ XSS

| Trường | Giá trị |
|---|---|
| **Environment** | Local (dev), QA |
| **Severity** | **Medium** — bảo mật; phụ thuộc nguồn dữ liệu content đã sanitize hay chưa |
| **Linked User Story** | US-047 / US-048 / US-049 (mọi câu đều render `content`) |
| **Build/commit hash** | branch `main`, chưa commit |
| **Attachments** | `frontend/src/components/exam/QuestionCard.test.tsx` (describe "question content", dòng 176-181) |

**Mô tả:**
`content` được render trực tiếp qua `dangerouslySetInnerHTML={{ __html: content }}` (`QuestionCard.tsx:77-80`) mà không sanitize. Nếu nội dung câu hỏi (do giảng viên/đề thi nhập, hoặc từ API) chứa HTML/script độc hại, code sẽ thực thi trong phiên làm bài của sinh viên (XSS).

**Steps to reproduce:**
1. `cd frontend && npm test -- --run` → test dòng 177-180 xác nhận HTML thô được render (`<strong>` thành thẻ thật) — chứng minh đường dẫn injection mở.
2. (Error case cần bổ sung) `content = '<img src=x onerror=alert(1)>'` → handler `onerror` sẽ chạy.

**Expected:** `content` được sanitize (whitelist thẻ an toàn, ví dụ DOMPurify) trước khi render; payload script bị loại bỏ.

**Actual:** HTML thô được chèn nguyên trạng, không sanitize → XSS khả thi nếu nguồn content không tin cậy.

---

## Ma trận tuân thủ test (Bảng 5.1)

Yêu cầu tối thiểu mỗi User Story (Bảng 5.1): **Happy ≥1, Edge ≥2, Error ≥2, Integration ≥1.**

Phân loại các test hiện có trong `QuestionCard.test.tsx`:

| User Story | Happy | Edge | Error | Integration | Kết luận |
|---|---|---|---|---|---|
| **US-047** Single Choice | 2 (renders options; click→onSelectAnswer 'B') | 1 (round indicator; difficulty fallback "Dễ" dùng chung) | 0 | 0 | **THIẾU** (Edge<2, Error<2, Integration<1) |
| **US-048** Multiple Choice | 2 (square+multi select; report each click) | 1 (highlight 2 đáp án cùng lúc) | 0 | 0 | **THIẾU** (Edge<2, Error<2, Integration<1) |
| **US-049** True/False | 2 (round+label; click→onSelectAnswer 'A') | 0 | 0 | 0 | **THIẾU** (Edge<2, Error<2, Integration<1) |
| **US-050** Câu hình ảnh | 0 | 0 | 1 (FAIL cố ý: không render `<img>`) | 0 | **THIẾU** + đang FAIL (chưa implement) |
| **US-054** Video phát mượt | 0 | 0 | 0 | 0 | **THIẾU** (chưa có implementation lẫn test) |

Ghi chú phủ chung (không gắn riêng 1 US): difficulty mapping (3 case + fallback unknown), question number/total, content HTML — hữu ích nhưng không thay được Edge/Error theo từng US.

**Tổng kết tuân thủ:**
- **Integration = 0 cho TẤT CẢ các US** — chưa có test luồng làm bài đầu-cuối (chọn đáp án → cập nhật state → điều hướng câu → nộp bài). Liên quan US-047..050, US-054.
- **Error case gần như = 0** — chưa test input bất hợp lệ (options rỗng, type sai, `selectedAnswers` chứa key không tồn tại, content độc hại).
- **Edge < 2** ở mọi US.
- **Component CHƯA có test:** `Timer.tsx`, `QuestionNav.tsx`, `SubmitConfirmModal.tsx`, `ExamHeader.tsx`, `StudentExamSidebar.tsx` — 0 test mỗi cái.
- **Coverage chưa chạy** — chưa có số liệu độ phủ.
- Chỉ `QuestionCard` có test (17 case, 1 fail cố ý).

**=> Không US nào trong EPIC-11 đạt ngưỡng Bảng 5.1.**

---

## Khuyến nghị đạt sign-off (Mục 7.6)

Ưu tiên theo thứ tự để đủ điều kiện sign-off FE cho EPIC-11 (Question Rendering):

**P0 — Bắt buộc trước sign-off (chặn nghiệp vụ / bảo mật):**
1. Fix **BUG-FE-001** (câu hình ảnh, US-050): thêm field media vào `QuestionCardProps` + render `<img>` (có `alt`); test US-050 chuyển từ FAIL → PASS.
2. Fix **BUG-FE-005** (XSS, bảo mật): sanitize `content` (DOMPurify hoặc tương đương) trước `dangerouslySetInnerHTML`; thêm Error test với payload `onerror`.
3. Xử lý **BUG-FE-002 / BUG-FE-003** (video/audio, US-051/052): thêm field + render `<video>`/`<audio>` hoặc ghi nhận chính thức là out-of-scope sprint hiện tại (Tech Lead/PO quyết định, ghi vào release note).

**P1 — Đạt ngưỡng test Bảng 5.1:**
4. Fix **BUG-FE-004**: ép single-selection ở component cho SINGLE_CHOICE/TRUE_FALSE; thêm Edge test `selectedAnswers=['A','B']`.
5. Bổ sung cho mỗi US (US-047/048/049/050): đủ **Edge ≥2, Error ≥2** — options rỗng, type không hợp lệ, key không tồn tại, content rỗng.
6. Thêm **≥1 Integration test/US**: luồng chọn đáp án → state cập nhật → điều hướng (QuestionNav) → nộp (SubmitConfirmModal). Cân nhắc e2e cho US-054.

**P2 — Hoàn thiện chất lượng:**
7. Viết test cho các component chưa phủ: `Timer`, `QuestionNav`, `SubmitConfirmModal`, `ExamHeader`, `StudentExamSidebar`.
8. Chạy **coverage** (`npm test -- --run --coverage`) và đính số liệu vào báo cáo test.

**Điều kiện sign-off:** tất cả bug P0 đóng (hoặc được PO chấp thuận giảm scope bằng văn bản); ma trận Bảng 5.1 đạt cho US-047/048/049/050; bộ test FE xanh hoàn toàn (không còn fail cố ý chưa xử lý); có số coverage.
