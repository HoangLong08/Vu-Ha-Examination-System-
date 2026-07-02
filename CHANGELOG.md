# Changelog

Tất cả thay đổi đáng chú ý của dự án **DAU Examination System** được ghi tại đây.

Định dạng theo [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/) và tuân
[Semantic Versioning](https://semver.org/lang/vi/) (xem Mục 6.5 — Quy trình CAIRA-DAU v1.0).

## [Unreleased]

### Added (phiên 2026-06 — phát triển mở rộng)
- **Khảo thí xem BÀI LÀM của sinh viên (giám sát/đối soát)** — `GET /v1/exams/:id/
  attempts` (ADMIN/EXAM_OFFICER): mỗi lượt thi hiện **tên/mã SV, trạng thái** (đang
  làm/đã nộp/hết giờ), **số câu đã trả lời / tổng**, **điểm + số câu đúng**, thời gian
  nộp; link **Xem bài** sang trang kết quả chi tiết. Tab admin mới **"Bài làm"**
  (`SubmissionsPanel`) kèm tổng lượt / đã nộp / điểm TB.
- **Câu hỏi Chọn vùng ảnh — Hot Area / Point and Shoot (đợt 4, nhóm đồ hoạ)** —
  loại `HOTSPOT`: thí sinh **click vào ảnh** để chỉ vị trí; chấm bằng **kiểm tra
  điểm rơi trong vùng đúng** (hình chữ nhật toạ độ chuẩn hoá 0..1). Hỗ trợ **nhiều
  vùng** (Point and Shoot); credit = (số vùng trúng − số click trượt)/số vùng (chống
  click bừa). exam-core DTO `CHON_VUNG_ANH` + `hotspotRects`; vùng đúng mã hoá vào
  `correctAnswer` nên **không lộ** cho thí sinh. Bank Minh hoạ thêm MED-13 (1 vùng)
  + MED-14 (2 vùng). _Drop and Connect (kéo-nối) dùng chung cơ chế gán mục→đích đã có._
- **Câu hỏi Đối sánh / Sắp thứ tự / Phân loại (đợt 3)** — hợp nhất "gán mục→đích":
  mỗi mục chọn 1 đích qua dropdown. exam-core DTO `DOI_SANH/SAP_THU_TU/PHAN_LOAI` +
  `assignItems/assignTargets/assignCorrect`; mapper → `MATCHING/ORDERING/CLASSIFY`
  (items/targets); `answerCredit` chấm **theo tỉ lệ gán đúng** (partial). Ngân hàng
  Vận dụng (qb…0006) + đề VD1060.
- **Câu hỏi TỰ LUẬN + chấm tay (đợt 2)** — ESSAY: ô nhập bài viết khi thi; **không tự
  chấm** mà khảo thí chấm tay. Schema `AttemptAnswer.manualCredit`; `gradeAttempt` tính
  lại điểm (ESSAY dùng manualCredit); `POST /attempts/:id/essay-grade` + `GET /exams/:id/
  essays`; tab admin **"Chấm tự luận"** (đọc bài + nhập điểm /10). Đề Toán có MATH-15.
- **Loại câu hỏi nhập text (đợt 1)** — **Điền khuyết** (FILL_BLANK, khớp text, nhiều đáp
  án ngăn bằng `|`) + **Điền giá trị** (NUMERIC, so sánh số): render ô nhập trong
  QuestionCard + **tự chấm** ở `answerCredit`; exam-core DTO mở rộng `DIEN_KHUYET/
  DIEN_GIA_TRI` + `correctText`. Đề Toán có câu mẫu (MATH-11..14).
- **Tích hợp nguồn câu hỏi/lịch thật exam-core (EPIC-21)** — adapter contract-first
  (`backend/src/exam-core/`): DTO sao y schema thật, mapper, client Mock(fixture)/HTTP,
  rút đề theo **ma trận** (section × độ khó), liên kết `ExamDefinition.examCoreBankId/MatrixId`.
  Cờ `EXAM_SOURCE=mock|exam-core`. Xem [17-exam-core-integration](docs/17-exam-core-integration.md).
- **Bộ đề fixture phong phú** — 5 ngân hàng: Lập trình C, Lịch sử Đảng, Tiếng Anh (có
  AUDIO), Minh hoạ Hình/Video (IMAGE/VIDEO), **Toán (công thức KaTeX)**.
- **Hiển thị giàu định dạng + công thức toán** — component `RichText` (B/I/U + LaTeX qua
  **KaTeX**, `$...$`/`$$...$$`) cho **câu hỏi + đáp án** + trang kết quả; sanitize DOMPurify.
- **Adapter đăng nhập contract-first (auth)** — `POST /api/auth/login` (mock giả lập tên
  Việt + seam `partner/login` thật), cờ `AUTH_SOURCE=dev|partner`. Xem
  [18-auth-integration](docs/18-auth-integration.md). Form đăng nhập tên/mật khẩu.
- **Báo cáo & thống kê (EPIC-20)** — `GET /v1/reports/{overview,exams/:id}` (điểm TB, tỉ lệ
  đạt, phổ điểm) + tab "Báo cáo" admin + **xuất CSV**.
- **Quản lý đề thi (admin)** — `GET/POST /v1/exam-definitions`, bảng đề thật + tạo đề.
- **Dashboard sinh viên động** — danh sách đề thật + hồ sơ cá nhân **giả lập** (tên/mã SV/
  lớp/khoa/ngày sinh) theo tài khoản.
- **Màn giám thị THẬT** — `GET /v1/invigilator/{sessions,sessions/:id/students}`: danh sách
  phòng = sĩ số lớp (giả lập) **ghép lượt thi thật** (đang làm/đã nộp/chưa đăng nhập), tiến
  độ + **đếm ngược thời gian LIVE** theo giờ sinh viên.
- **Logo Trường ĐH Kiến trúc Đà Nẵng** + chuẩn hoá theme sáng/tối (Tailwind v4 `@custom-variant`).
- 20 tài khoản sinh viên giả lập (sv001…sv020) + đề Toán có công thức để test.

### Added
- **Luồng thi chạy thật end-to-end** — start (snapshot câu hỏi) → lưu/autosave → khôi phục
  cross-máy (EPIC-13) → nộp → **chấm điểm thật** → xem kết quả. Seed ExamDefinition.
- **Trang kết quả thật (EPIC-18)** — `GET /attempts/:id/review`: điểm + từng câu (đáp án đã
  chọn / đáp án đúng / đúng-sai-bỏ trống).
- **Cấu hình hiện/ẩn điểm (FR-L-003, EPIC-24)** — `showResult` trên đề thi +
  `GET/PATCH /api/v1/exam-definitions/:id[/config]` (khảo thí). Bật → SV **xem điểm NGAY
  sau khi nộp**; tắt → chỉ báo "đã hoàn thành" (giấu điểm). Toggle ở trang admin.
- **Công bố kết quả (EPIC-18, UC-046/047)** — `POST /api/v1/exams/:examDefinitionId/results/{publish,unpublish}`
  (workflow công bố trễ tuỳ chọn). `getStudentResults` chỉ trả kết quả đã công bố.
- **Tài liệu phân tích bài toán** — Brief ([00-brief](docs/00-brief.md)) + Ma trận truy vết
  ([16-traceability-matrix](docs/16-traceability-matrix.md)).

### Changed
- **Acceptance Criteria gộp về 1 nguồn** ([06](docs/06-acceptance-criteria.md)); gỡ khỏi SRS;
  sửa số Epic khớp Epic Catalog; bổ sung AC còn thiếu (AC-026..038).
- **SRS** thêm MODULE Q (Exam Configuration) + MODULE R (User/Role Management).
- Đánh số lại docs tuần tự **00–16** theo SDLC.

## [0.1.0] — 2026-06-12

Bản giao đầu tiên của phân hệ **Thi trắc nghiệm** (Grading Engine + UI làm bài) kèm
bộ kiểm thử QC theo chuẩn CAIRA-DAU v1.0. **QC verdict: ĐẠT SIGN-OFF** (không còn bug
Critical/High Open). Chi tiết: [docs/15-test-report-wave2-trac-nghiem.md](docs/15-test-report-wave2-trac-nghiem.md).

### Added
- **Grading Engine (EPIC-17)** — chấm điểm tự động khi nộp bài: SINGLE_CHOICE, TRUE_FALSE,
  MULTIPLE_CHOICE (so tập đáp án, order-independent). Hỗ trợ **Partial Credit** qua
  `gradingMode` (`ALL_OR_NOTHING` | `PARTIAL`) — US-076/077/078/079.
- **Tự động nộp bài khi hết giờ (US-074)** — `AttemptsService.autoSubmitExpired()` +
  cron `@Cron(EVERY_MINUTE)` qua `@nestjs/schedule`.
- **UI làm bài (EPIC-11)** — `QuestionCard` render câu **hình ảnh** (US-050), **video**
  (US-051), **audio** (US-052); ép single-selection cho câu một đáp án.
- **Swagger / OpenAPI** (Mục 8.3) — tài liệu API tại `/api/docs` cho toàn bộ controller.
- **Bộ test nghiệp vụ QC** — 139 test (91 backend Jest + 12 integration Supertest +
  36 frontend Vitest); hạ tầng Vitest + Testing Library cho frontend.
- **Integration test (Supertest)** — luồng làm bài đầu-cuối qua HTTP (mock Prisma,
  không cần DB), chạy trong CI (`npm run test:e2e`).
- **CI coverage gate** (Bảng 6.2) — `npm run test:cov` với threshold scoped ≥80%.
- **Tài liệu QC** — bug tickets ([docs/bugs/](docs/bugs/)), QC test report, chuẩn vận hành
  sub-agent QC ([docs/11-qc-subagent-process.md](docs/11-qc-subagent-process.md)).
- **PR template** theo Phụ lục B (19 mục) và **CHANGELOG / ROLLBACK plan**.
- Trường `Exam.deletedAt` cho cơ chế xóa mềm.

### Fixed
- **BUG-BE-001 (Critical)** — bài thi luôn 0 điểm: `isCorrect` không bao giờ được tính.
  Nay chấm điểm thật tại `submit()`.
- **BUG-BE-002 (Critical)** — lộ đáp án: API câu hỏi không còn trả `correctAnswer`/`explanation`.
- **BUG-BE-004 (High)** — mẫu số điểm = tổng số câu của đề (không phải số câu đã trả lời).
- **BUG-BE-005 (High)** — `ExamsService.remove()` chuyển từ xóa cứng sang **xóa mềm**
  (`deletedAt`), `findAll`/`findOne` lọc `deletedAt: null`.
- **BUG-FE-005 (Medium)** — sanitize nội dung câu hỏi bằng DOMPurify (chống XSS).

### Known issues / Backlog
- **BUG-BE-007** — `sessionId`/`studentId` còn là placeholder ở controller (cần map Student/Session thật).
- **BUG-BE-008** — đường dẫn mock dùng `process.cwd()` + `catch` nuốt lỗi.
- e2e với **DB Postgres thật** cho UAT (integration test hiện chạy với Prisma mock).

[Unreleased]: https://github.com/niitbeo/caira-khaothi-test/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/niitbeo/caira-khaothi-test/releases/tag/v0.1.0
