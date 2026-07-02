# Backend Bug Tickets — DAU Examination System

> Tài liệu này được lập bởi QC Officer (team CAIRA-DAU) theo **Quy trình phát triển phần mềm CAIRA-DAU v1.0**.
> - Bug template: **Mục 7.4**
> - Severity: **Mục 7.5** (Critical SLA<4h / High SLA<24h / Medium <1 sprint / Low backlog)
> - Khuyến nghị sign-off: **Mục 7.6**
> - Ma trận tuân thủ test: **Bảng 5.1** (Happy ≥1, Edge ≥2, Error ≥2, Integration ≥1)
>
> **Phạm vi:** chỉ tài liệu hóa phát hiện QA backend. KHÔNG sửa code nghiệp vụ.
> **Bằng chứng:** các phát hiện đã được verify bằng test ở wave trước (xem cột *Attachments*).
>
> | Trường chung | Giá trị |
> |---|---|
> | Environment | Local/QA |
> | Build/commit hash | branch `main`, **chưa commit** |
> | Ngày lập | 2026-06-12 |
> | Coverage backend tổng | **30.16%** (Gate ≥80% cho code mới → **CHƯA ĐẠT**) |

## Tổng quan severity

| Severity | Số lượng | Mã bug |
|---|---|---|
| Critical | 2 | BUG-BE-001, BUG-BE-002 |
| High | 4 | BUG-BE-003, BUG-BE-004, BUG-BE-005, BUG-BE-006 |
| Medium | 1 | BUG-BE-007 |
| Low | 1 | BUG-BE-008 |
| **Tổng** | **8** | |

---

## BUG-BE-001 — [BUG] Không có chấm điểm tự động: điểm bài thi luôn = 0

| Trường | Giá trị |
|---|---|
| **Tiêu đề** | [BUG] `submit()` đếm `isCorrect===true` nhưng không quy trình nào set `isCorrect` → điểm bài thi luôn 0 |
| **Environment** | Local/QA |
| **Severity** | **Critical** (mất tính đúng đắn của kết quả thi — blocker nghiệp vụ chấm điểm; SLA < 4h) |
| **Linked User Story** | US-076, US-077, US-078, US-079 (EPIC-17 Grading Engine) |
| **Build/commit hash** | branch `main`, chưa commit |

**Steps to reproduce**
1. `cd backend`
2. Chạy: `npx jest src/attempts/attempts.scoring.spec.ts -t "student answers SINGLE_CHOICE correctly then submits => score MUST be > 0"`

**Expected behavior**
Sinh viên trả lời đúng câu SINGLE_CHOICE rồi submit → `correctAnswers = 1`, `score > 0`.

**Actual behavior**
`saveAnswer()` (`attempts.service.ts:126`) và `autoSave()` (`attempts.service.ts:168`) chỉ upsert `answerValue`, **không bao giờ set `isCorrect`**. Do đó tại `submit()` (`attempts.service.ts:262-264`), `answers.filter(a => a.isCorrect === true)` luôn ra 0 → `correctAnswers = 0`, `score = 0` cho mọi bài thi, kể cả khi sinh viên trả lời đúng hết.

**Attachments**
`backend/src/attempts/attempts.scoring.spec.ts` (các test trong `describe('submit() scoring')`: "all answers correct => score 10...", "partial correctness => proportional score", "score is rounded...").

---

## BUG-BE-002 — [BUG] Lộ đáp án: `getExamQuestions` trả correctAnswer + explanation cho client

| Trường | Giá trị |
|---|---|
| **Tiêu đề** | [BUG] `getExamQuestions` trả nguyên file mock (gồm `correctAnswer` + `explanation`) và không lọc theo `examId` → lộ đáp án cho thí sinh |
| **Environment** | Local/QA |
| **Severity** | **Critical** (lỗ hổng bảo mật — lộ đáp án phá vỡ tính toàn vẹn kỳ thi; SLA < 4h) |
| **Linked User Story** | EPIC-11 Question Rendering (US-047 → US-050) + yêu cầu bảo mật chung |
| **Build/commit hash** | branch `main`, chưa commit |

**Steps to reproduce**
1. `cd backend`
2. Chạy: `npx jest src/exams/exams.service.spec.ts -t "KHÔNG lọc theo examId — examId bậy vẫn trả full"`

**Expected behavior**
- Endpoint câu hỏi cho thí sinh phải **lọc theo `examId`** và **loại bỏ** trường `correctAnswer`/`explanation` trước khi trả về client.

**Actual behavior**
`getExamQuestions()` (`exams.service.ts:161-188`) đọc thẳng `mock-api/questions.json` và `return mockData` nguyên trạng. Không lọc theo `examId` (mọi `examId`, kể cả chuỗi rỗng hay sai, đều trả cùng full danh sách 4 câu) và không strip `correctAnswer`/`explanation` → thí sinh có thể đọc được đáp án.

**Attachments**
`backend/src/exams/exams.service.spec.ts` (`describe('getExamQuestions')`: test "KHÔNG lọc theo examId — examId bậy vẫn trả full", "trả đúng dữ liệu mock (data + meta)").

---

## BUG-BE-003 — [BUG] Multiple Choice chưa hỗ trợ cấu hình All-or-Nothing / Partial Credit

| Trường | Giá trị |
|---|---|
| **Tiêu đề** | [BUG] Không có logic chấm Multiple Choice theo cấu hình tuyệt đối (All-or-Nothing) / từng phần (Partial Credit) như US-077 yêu cầu |
| **Environment** | Local/QA |
| **Severity** | **High** (ảnh hưởng nghiêm trọng luồng chấm điểm chính, không có workaround; SLA < 24h) |
| **Linked User Story** | US-077 (EPIC-17) |
| **Build/commit hash** | branch `main`, chưa commit |

**Steps to reproduce**
1. `cd backend`
2. Chạy: `npx jest src/attempts/attempts.scoring.spec.ts -t "MULTIPLE_CHOICE"`
3. Quan sát: oracle trong spec định nghĩa quy tắc exact-set; production `submit()` không có nhánh nào xử lý cấu hình All-or-Nothing vs Partial Credit.

**Expected behavior**
US-077 yêu cầu chấm Multiple Choice theo cấu hình: **All-or-Nothing** (đúng toàn bộ tập đáp án mới được điểm) hoặc **Partial Credit** (điểm theo từng phần).

**Actual behavior**
Không tồn tại logic chấm Multiple Choice nào trong service (do BUG-BE-001, `isCorrect` không bao giờ được tính). Không có cờ cấu hình All-or-Nothing/Partial Credit ở schema lẫn service.

**Attachments**
`backend/src/attempts/attempts.scoring.spec.ts` (`describe('grading rules (specification oracle)')`: các test "MULTIPLE_CHOICE: exact set ...", "different order ... still correct", "missing one option is wrong", "extra option is wrong").

---

## BUG-BE-004 — [BUG] `totalQuestions = answers.length` → câu bỏ trống bị loại khỏi mẫu số, điểm sai/thổi phồng

| Trường | Giá trị |
|---|---|
| **Tiêu đề** | [BUG] `submit()` dùng `answers.length` làm tổng số câu → câu chưa trả lời không tính vào mẫu số, điểm bị thổi phồng |
| **Environment** | Local/QA |
| **Severity** | **High** (sai kết quả chấm điểm luồng chính, không workaround; SLA < 24h) |
| **Linked User Story** | US-079 (EPIC-17) |
| **Build/commit hash** | branch `main`, chưa commit |

**Steps to reproduce**
1. `cd backend`
2. Chạy: `npx jest src/attempts/attempts.scoring.spec.ts -t "unanswered question counts as wrong"`

**Expected behavior**
`totalQuestions` phải là **tổng số câu của đề thi**. Câu sinh viên bỏ trống vẫn nằm trong mẫu số và tính là sai (vd 1 đúng / 2 câu đề → score 5).

**Actual behavior**
`totalQuestions = updatedAttempt.answers.length` (`attempts.service.ts:261`). Nếu sinh viên không tạo record answer cho câu bỏ trống, câu đó **không vào mẫu số** → tỉ lệ đúng/tổng bị thổi phồng, `score = (correct/answers.length)*10` sai.

**Attachments**
`backend/src/attempts/attempts.scoring.spec.ts` (test "unanswered question counts as wrong" — kỳ vọng `wrongAnswers=1`, `score=5`).

---

## BUG-BE-005 — [BUG] Xóa cứng đề thi (hard delete) trái API contract "xóa mềm"

| Trường | Giá trị |
|---|---|
| **Tiêu đề** | [BUG] `remove()` gọi `prisma.exam.delete` (hard delete) thay vì soft-delete → mất data không khôi phục được |
| **Environment** | Local/QA |
| **Severity** | **High** (mất data không khôi phục, vi phạm API contract; SLA < 24h) |
| **Linked User Story** | Exam CRUD / quản lý đợt thi (API contract `DELETE .../exam-terms/{id}` — "Xóa mềm đợt thi") |
| **Build/commit hash** | branch `main`, chưa commit |

**Steps to reproduce**
1. `cd backend`
2. Chạy: `npx jest src/exams/exams.service.spec.ts -t "remove là HARD delete"`

**Expected behavior**
API contract (`docs/08-api-contract.md`) yêu cầu **xóa mềm**: set `deletedAt` qua `update`, giữ lại bản ghi để khôi phục/truy vết.

**Actual behavior**
`remove()` (`exams.service.ts:115`) gọi `this.prisma.exam.delete({ where: { id } })` → xóa cứng vĩnh viễn, không hề gọi `update`/set `deletedAt`. Test xác nhận `prisma.exam.delete` được gọi 1 lần và `prisma.exam.update` không được gọi.

**Attachments**
`backend/src/exams/exams.service.spec.ts` (`describe('remove')`: test "PHƠI BÀY rủi ro: remove là HARD delete ...").

---

## BUG-BE-006 — [BUG] Không tự động nộp bài khi hết giờ

| Trường | Giá trị |
|---|---|
| **Tiêu đề** | [BUG] Không có cơ chế cưỡng chế tự động nộp bài + khóa giao diện khi hết thời gian |
| **Environment** | Local/QA |
| **Severity** | **High** (ảnh hưởng toàn vẹn kỳ thi luồng chính, không workaround server-side; SLA < 24h) |
| **Linked User Story** | US-074 (EPIC-16) — "Khóa giao diện khi hết giờ. Lưu đáp án cuối cùng và nộp tự động." |
| **Build/commit hash** | branch `main`, chưa commit |

**Steps to reproduce**
1. `cd backend`
2. Chạy: `npx jest src/attempts/attempts.lifecycle.spec.ts -t "remainingSeconds KHÔNG bao giờ âm"`
3. Quan sát: `remainingSeconds` chỉ được tính lại **khi `autoSave()` được gọi**; không có scheduler/guard nào tự chuyển attempt sang SUBMITTED/EXPIRED khi về 0.

**Expected behavior**
Khi hết thời gian: hệ thống tự **khóa thao tác**, lưu đáp án cuối và **nộp tự động** (chuyển trạng thái và tạo Result).

**Actual behavior**
`remainingSeconds` chỉ giảm khi client gọi `autoSave()` (`attempts.service.ts:194-207`); kẹp về 0 nhưng **không** kích hoạt nộp bài. Không có cơ chế cưỡng chế phía server → nếu client ngừng gọi autoSave, attempt treo vô thời hạn ở IN_PROGRESS.

**Attachments**
`backend/src/attempts/attempts.lifecycle.spec.ts` (`describe('autoSave')`: "tính remainingSeconds = totalSeconds - elapsed", "remainingSeconds KHÔNG bao giờ âm — kẹp về 0 khi đã hết giờ").

---

## BUG-BE-007 — [BUG] `sessionId`/`studentId` là placeholder → truy vết phiên thi sai

| Trường | Giá trị |
|---|---|
| **Tiêu đề** | [BUG] `sessionId = examId` và `studentId = req.user.id` là placeholder → có thể tạo attempt mồ côi, truy vết phiên thi sai |
| **Environment** | Local/QA |
| **Severity** | **Medium** (luồng có thể vận hành tạm với dữ liệu sai; có workaround cấu hình; < 1 sprint) |
| **Linked User Story** | Lifecycle attempt / quản lý phiên thi (EPIC-16) |
| **Build/commit hash** | branch `main`, chưa commit |

**Steps to reproduce**
1. Mở `backend/src/attempts/attempts.controller.ts`, xem `startExam()` (dòng 52-53).
2. Quan sát comment trong code: `// Placeholder — should be derived from actual session`.
3. (Tham chiếu lifecycle) `npx jest src/attempts/attempts.lifecycle.spec.ts -t "startExam"`

**Expected behavior**
`studentId` tra cứu từ user thực; `sessionId` lấy từ phiên thi đang mở thực tế.

**Actual behavior**
`attempts.controller.ts:52-53`: `studentId = req.user.id` (không map sang Student), `sessionId = examId` (dùng tạm `examId` làm session). Hệ quả: liên kết attempt ↔ session sai, có thể tạo attempt mồ côi (không gắn session hợp lệ).

**Attachments**
`backend/src/attempts/attempts.controller.ts:42-61`; `backend/src/attempts/attempts.lifecycle.spec.ts` (`describe('startExam')`).

**Resolution (2026-06-13)** — ✅ ĐÃ XỬ LÝ. `studentId` resolve qua `resolveStudentId(user)` (Student.id = User.id theo quy ước demo). `sessionId` KHÔNG còn = `examId`: `startExam` tra `SessionExam` theo `examDefinitionId` → gắn `ExamSession` THẬT nếu có, ngược lại `null` (hợp lệ). Test lifecycle khẳng định `sessionId` null + ≠ examId; verify LIVE: attempt VD1060 gắn `CA-VD1060`.

---

## BUG-BE-008 — [BUG] Mock path dùng `process.cwd()` + `catch` nuốt lỗi

| Trường | Giá trị |
|---|---|
| **Tiêu đề** | [BUG] `getExamQuestions` resolve mock theo `process.cwd()` và `catch` nuốt lỗi im lặng → lỗi đọc dữ liệu bị che giấu |
| **Environment** | Local/QA |
| **Severity** | **Low** (vận hành/cosmetic, không lỗi nghiệp vụ trực tiếp; backlog) |
| **Linked User Story** | EPIC-11 (phụ trợ tải câu hỏi) |
| **Build/commit hash** | branch `main`, chưa commit |

**Steps to reproduce**
1. `cd backend`
2. Chạy: `npx jest src/exams/exams.service.spec.ts -t "fallback trả mảng rỗng"`

**Expected behavior**
Đường dẫn dữ liệu không phụ thuộc thư mục làm việc khi chạy; lỗi đọc file phải được log/raise rõ ràng.

**Actual behavior**
`exams.service.ts:163-174`: path resolve theo `process.cwd() + '../mock-api/questions.json'` (vỡ khi cwd khác), và khối `catch {}` nuốt mọi lỗi rồi trả mảng rỗng → lỗi I/O bị che giấu, khó debug.

**Attachments**
`backend/src/exams/exams.service.spec.ts` (test "fallback trả mảng rỗng + meta khi đọc file lỗi/không tồn tại").

**Resolution (2026-06-13)** — ✅ ĐÃ XỬ LÝ. Path qua helper `resolveMockPath()`: ưu tiên ENV `MOCK_API_PATH` (`MOCK_EXAM_DEF_PATH` cho exam-definition), fallback mới về `<cwd>/../mock-api`. Các khối `catch` không còn nuốt im lặng — `this.logger.warn(...)` ghi rõ path + lỗi, vẫn trả rỗng an toàn.

---

## Ma trận tuân thủ test (Bảng 5.1)

**Yêu cầu tối thiểu / User Story:** Happy ≥1, Edge ≥2 (boundary/empty/null), Error ≥2 (invalid/unauthorized/conflict), Integration ≥1.

Số liệu dưới đây đếm từ các spec đã viết: `attempts.scoring.spec.ts`, `attempts.lifecycle.spec.ts`, `exams.service.spec.ts`.

| User Story / Nhóm | Happy (≥1) | Edge (≥2) | Error (≥2) | Integration (≥1) | Kết luận |
|---|---|---|---|---|---|
| **US-076** Chấm Single Choice | 1 (correct selection is correct) — **ĐẠT** | 2+ (wrong selection, unanswered null/empty) — **ĐẠT** | submit guards (SUBMITTED/EXPIRED/NotFound) = 3 — **ĐẠT** | **0** — **THIẾU** | **THIẾU** (Integration=0; ngoài ra bug BUG-BE-001 khiến chấm điểm không chạy thật) |
| **US-077** Chấm Multiple Choice | 1 (exact set "A,C") — **ĐẠT** | 3+ (order khác, thiếu option, thừa option) — **ĐẠT** | (dùng chung submit guards) — **ĐẠT** | **0** — **THIẾU** | **THIẾU** (Integration=0; thiếu cấu hình All-or-Nothing/Partial Credit → BUG-BE-003) |
| **US-078** Chấm True/False | 1 (matching value is correct) — **ĐẠT** | 2 (opposite value wrong, unanswered) — **ĐẠT** | (dùng chung submit guards) — **ĐẠT** | **0** — **THIẾU** | **THIẾU** (Integration=0) |
| **US-079** Tổng điểm / đúng / sai | 1 (all correct => 10) — **ĐẠT** | 3+ (partial 2/4, unanswered vào mẫu số, rounding 1/3) — **ĐẠT** | 0 chuyên cho tổng hợp điểm — **THIẾU** | **0** — **THIẾU** | **THIẾU** (Error <2 cho riêng tổng hợp; Integration=0; mẫu số sai → BUG-BE-004) |
| **US-074** Tự động nộp khi hết giờ | 0 happy "auto-submit" thật — **THIẾU** | 2 (remaining kẹp 0, fallback duration=60) — **ĐẠT** | 2 (BadRequest khi không active, NotFound) — **ĐẠT** | **0** — **THIẾU** | **THIẾU** (chưa có test/feature auto-submit; Integration=0; BUG-BE-006) |
| **US-054** Video phát mượt | 0 — **THIẾU** | 0 — **THIẾU** | 0 — **THIẾU** | **0** — **THIẾU** | **THIẾU TOÀN BỘ** (không có spec backend tương ứng) |
| **Exam CRUD** (create/findAll/findOne/update/remove) | findAll/findOne/create/update — **ĐẠT** | empty filter, phân trang, chỉ field cung cấp — **ĐẠT** | NotFound (findOne/update/remove) ≥3 — **ĐẠT** | **0** — **THIẾU** | **THIẾU** (Integration=0; remove hard-delete → BUG-BE-005) |

### Phát hiện trọng yếu của ma trận
- **Integration test = 0 cho MỌI User Story.** Chưa có Supertest/test HTTP end-to-end nghiệp vụ. File `backend/test/app.e2e-spec.ts` chỉ có 3 test khung mẫu (không phủ US nào). → **THIẾU toàn bộ chiều Integration của Bảng 5.1.**
- **Coverage controller = 0%:** `attempts.controller.ts = 0%`, `exams.controller.ts = 0%`. Toàn bộ `dto/`, `module`, `auth/`, `common/`, `users/`, `violations/` = **0%**.
- Coverage service (đã có): `attempts.service ~80%`, `exams.service ~97.6%`, `admin.service ~66%`, `invigilator.service ~50%`. **Tổng coverage backend = 30.16%** → dưới Gate ≥80% cho code mới → **CHƯA ĐẠT.**
- **US-054** không có bất kỳ spec backend nào → thiếu toàn bộ 4 loại test.

---

## Khuyến nghị đạt sign-off (Mục 7.6)

Để QC có thể sign-off, Dev cần hoàn tất các việc sau (ưu tiên theo severity & gate):

1. **Sửa BUG-BE-001 (Critical):** triển khai tính `isCorrect` khi lưu đáp án (hoặc tính lúc `submit()` bằng cách so `answerValue` với `correctAnswer` của question snapshot). Đây là blocker — không chấm điểm thì mọi US grading vô nghĩa.
2. **Sửa BUG-BE-002 (Critical):** `getExamQuestions` phải lọc theo `examId` và **strip `correctAnswer`/`explanation`** trước khi trả client. Kèm test khẳng định không lộ đáp án.
3. **Sửa các High BUG-BE-003/004/005/006:**
   - BE-003: thêm cấu hình All-or-Nothing/Partial Credit cho Multiple Choice.
   - BE-004: dùng tổng số câu của đề làm `totalQuestions` (không phải `answers.length`).
   - BE-005: chuyển `remove()` sang soft-delete (`update` set `deletedAt`).
   - BE-006: thêm cơ chế cưỡng chế auto-submit khi hết giờ (scheduler/guard + lưu Result).
4. **Bổ sung Integration test (Supertest) cho mọi US ở trên** (hiện = 0) và **nâng coverage code mới ≥80%** — đặc biệt phủ `attempts.controller` và `exams.controller` (hiện 0%), cùng dto/auth/common/users/violations. Đây là điều kiện cứng của Gate.
5. **Xử lý Medium/Low + US-054:** sửa placeholder `sessionId`/`studentId` (BE-007); làm cứng mock path + log lỗi (BE-008); bổ sung test/feature cho US-054 (hiện thiếu toàn bộ).

> **Trạng thái QC hiện tại: TỪ CHỐI SIGN-OFF.** Lý do: 2 Critical (1 sai chấm điểm, 1 lộ đáp án) + Integration test = 0 cho mọi US + coverage 30.16% < Gate 80%.
