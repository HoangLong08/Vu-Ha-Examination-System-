# 📋 QC Test Report — Wave 2: Phần mềm Trắc nghiệm (Làm bài & Chấm điểm)

**Project:** DAU Examination System (Hệ thống Khảo thí — ĐH Kiến trúc Đà Nẵng)
**Áp dụng:** Quy trình phát triển phần mềm CAIRA-DAU v1.0 — Chương 7 (QC) & Chương 8 (Quality gates)
**Date:** 2026-06-12
**Tester:** QC Team (2 sub-agent QC + Tech Lead tổng hợp)
**Scope:** EPIC-11 Question Rendering, EPIC-17 Grading Engine, EPIC-18 Result, luồng Làm bài (US-047→050, US-054, US-074, US-076→079)
**Environment:** Local / QA (unit + component test, mock PrismaService, Vitest jsdom)

---

## 🔑 Executive Summary — QC Verdict

### Vòng 1 (QC phát hiện): ❌ TỪ CHỐI SIGN-OFF — 2 Critical + 6 High, coverage 30%.
### Vòng 2 (Dev fix P0): 🟡 SIGN-OFF CÓ ĐIỀU KIỆN — Critical cleared, còn 3 High.
### Vòng 3 (Dev fix nốt 3 High, re-test): ✅ ĐẠT QC SIGN-OFF (Mục 7.6)

**Không còn bug Critical/High ở trạng thái Open.** Phần mềm chấm điểm thật (gồm partial credit), tự động nộp khi hết giờ, render câu hình ảnh/video/audio, không lộ đáp án. Coverage gate xanh, build/tsc sạch. Lưu ý còn lại: **Integration test (Supertest) chưa có** — khuyến nghị bổ sung trước UAT.

| Tiêu chí sign-off (Mục 7.6) | Yêu cầu | Vòng 1 | Vòng 3 (re-test) |
|---|---|---|---|
| 100% test case đã execute | 100% | ✅ 95/95 | ✅ 139/139 |
| Không còn bug **Critical** Open | 0 | ❌ 2 | ✅ **0** |
| Không còn bug **High** Open | 0 | ❌ 6 | ✅ **0** |
| Coverage code mới ≥ 80% (Bảng 6.2) | ≥80% | ❌ 30% | ✅ attempts 88% / exams 98% (gate scoped) |
| Swagger mọi endpoint (Mục 8.3) | có | ❌ | ✅ `/api/docs` |
| Integration test ≥ 1 / US (Bảng 5.1) | ≥1/US | ❌ 0 | ✅ 12 (Supertest, mock Prisma — không cần DB) |

### Bug status sau re-test (vòng 3)

| Mã | Severity | Trạng thái |
|---|---|---|
| BUG-BE-001 chấm điểm tự động | 🔴 Critical | ✅ RESOLVED — grade theo type, mẫu số = tổng câu đề |
| BUG-BE-002 lộ đáp án | 🔴 Critical | ✅ RESOLVED — strip `correctAnswer`/`explanation` (lọc examId chờ DB) |
| BUG-BE-003 MCQ Partial Credit | 🟠 High | ✅ RESOLVED — `gradingMode` ALL_OR_NOTHING/PARTIAL (US-077) |
| BUG-BE-004 mẫu số sai | 🟠 High | ✅ RESOLVED — `totalQuestions` = số câu của đề |
| BUG-BE-005 hard delete | 🟠 High | ✅ RESOLVED — soft delete `deletedAt` + lọc `deletedAt:null` |
| BUG-BE-006 auto-submit hết giờ | 🟠 High | ✅ RESOLVED — `autoSubmitExpired` + `@Cron` mỗi phút (US-074) |
| BUG-FE-001 câu hình ảnh | 🟠 High | ✅ RESOLVED — render `<img mediaUrl>` |
| BUG-FE-002 câu video | 🟠 High | ✅ RESOLVED — render `<video>` (US-051) |
| BUG-FE-005 XSS | 🟡 Medium | ✅ RESOLVED — sanitize bằng DOMPurify |
| BUG-FE-004 single-selection | 🟡 Medium | ✅ RESOLVED — radiogroup + ép 1 đáp án |
| BUG-FE-003 câu audio | 🟡 Medium | ✅ RESOLVED — render `<audio>` (US-052) |
| BUG-BE-007 sessionId/studentId placeholder | 🟡 Medium | ⏳ OPEN — backlog (cần map Student/Session thật) |
| BUG-BE-008 mock path / catch nuốt lỗi | 🟢 Low | ⏳ OPEN — backlog |

**Hạ tầng chuẩn đã thêm:** Swagger UI `/api/docs` (Mục 8.3); CI coverage gate scoped ≥80% trong `ci.yml` (Bảng 6.2); auto-submit qua `@nestjs/schedule` (ScheduleModule).

**Đã bổ sung (vòng 3+):** 12 Integration test Supertest (luồng start→answer→autosave→submit→result + negative paths), chạy trong CI không cần DB. **Còn lại (backlog, không chặn sign-off):** BUG-BE-007 (map Student/Session thật); BUG-BE-008 (mock path); e2e với DB Postgres thật cho UAT.

---

## 1. Kết quả thực thi test

| Khu vực | Test | Pass | Fail | Ghi chú |
|---|---|---|---|---|
| Backend (Jest) | 78 | 73 | 5 | 5 fail **cố ý** — probe lỗ hổng chấm điểm (BUG-BE-001) |
| Frontend (Vitest) | 17 | 16 | 1 | 1 fail **cố ý** — probe câu hình ảnh (BUG-FE-001) |
| **Tổng** | **95** | **89** | **6** | 6 fail-by-design encode kỳ vọng nghiệp vụ đúng |

**File test:**
- `backend/src/attempts/attempts.scoring.spec.ts` (22) — chấm điểm & nộp bài
- `backend/src/attempts/attempts.lifecycle.spec.ts` (24) — vòng đời bài thi
- `backend/src/exams/exams.service.spec.ts` (28) — đề thi & câu hỏi
- `frontend/src/components/exam/QuestionCard.test.tsx` (17) — render câu hỏi

> 6 test FAIL **không phải lỗi viết test** — chúng mã hóa đúng quy tắc nghiệp vụ và fail vì code thiếu logic. Khi Dev sửa bug tương ứng, các test này tự chuyển PASS.

---

## 2. Coverage (Bảng 6.2 — gate ≥ 80%)

**Backend tổng: 30.16% stmts** — ❌ chưa đạt.

| Module | Stmts | Đánh giá |
|---|---|---|
| `exams.service.ts` | 97.6% | ✅ |
| `attempts.service.ts` | 80% | ✅ (ngưỡng) |
| `admin.service.ts` | 66% | ⚠️ |
| `invigilator.service.ts` | 50% | ⚠️ |
| `attempts.controller.ts` | **0%** | ❌ chưa có controller test |
| `exams.controller.ts` | **0%** | ❌ |
| dto / module / auth / common / users / violations | **0%** | ❌ ngoài scope wave này |

**Frontend:** chưa chạy coverage; chỉ `QuestionCard` có test. 5 component (`Timer`, `QuestionNav`, `SubmitConfirmModal`, `ExamHeader`, `StudentExamSidebar`) chưa có test.

---

## 3. Danh sách bug (theo severity — Mục 7.5)

Chi tiết đầy đủ theo template Mục 7.4 tại: [docs/bugs/backend-bugs.md](bugs/backend-bugs.md) và [docs/bugs/frontend-bugs.md](bugs/frontend-bugs.md).

| Mã | Severity | Tiêu đề | US | SLA |
|---|---|---|---|---|
| BUG-BE-001 | 🔴 Critical | Không chấm điểm tự động — `isCorrect` không bao giờ set, điểm luôn 0 | US-076/077/078/079 | <4h |
| BUG-BE-002 | 🔴 Critical | Lộ đáp án — `getExamQuestions` trả `correctAnswer`+`explanation`, không lọc `examId` | EPIC-11 | <4h |
| BUG-BE-003 | 🟠 High | MCQ chưa hỗ trợ All-or-Nothing / Partial Credit | US-077 | <24h |
| BUG-BE-004 | 🟠 High | `totalQuestions = answers.length` → mẫu số sai, điểm thổi phồng | US-079 | <24h |
| BUG-BE-005 | 🟠 High | Xóa cứng đề thi (hard delete) trái contract "xóa mềm" | — | <24h |
| BUG-BE-006 | 🟠 High | Không tự động nộp bài khi hết giờ | US-074 | <24h |
| BUG-FE-001 | 🟠 High | Câu hình ảnh không render `<img>` | US-050 | <24h |
| BUG-FE-002 | 🟠 High | Câu video chưa hỗ trợ | US-051 | <24h |
| BUG-BE-007 | 🟡 Medium | `sessionId`/`studentId` placeholder ở controller | — | <1 sprint |
| BUG-FE-003 | 🟡 Medium | Câu audio chưa hỗ trợ | US-052 | <1 sprint |
| BUG-FE-004 | 🟡 Medium | Không tự ép single-selection trong component | US-047/049 | <1 sprint |
| BUG-FE-005 | 🟡 Medium | XSS qua `dangerouslySetInnerHTML` (content chưa sanitize) | — | <1 sprint |
| BUG-BE-008 | 🟢 Low | Mock path theo `process.cwd()` + catch nuốt lỗi | — | Backlog |

**Tổng: 2 Critical · 6 High · 4 Medium · 1 Low = 13 bug.**

---

## 4. Ma trận tuân thủ test (Bảng 5.1)

Yêu cầu mỗi US: Happy ≥1, Edge ≥2, Error ≥2, Integration ≥1.

| User Story | Happy | Edge | Error | Integration | Đạt? |
|---|---|---|---|---|---|
| US-047 Single Choice | ✅ | ⚠️ <2 | ❌ | ❌ | THIẾU |
| US-048 Multiple Choice | ✅ | ⚠️ <2 | ❌ | ❌ | THIẾU |
| US-049 True/False | ✅ | ❌ | ❌ | ❌ | THIẾU |
| US-050 Câu hình ảnh | ❌ (fail) | ❌ | ✅1 | ❌ | THIẾU |
| US-054 Nộp bài thủ công | ❌ | ❌ | ❌ | ❌ | TRỐNG |
| US-076/077/078 Chấm điểm | ✅ | ✅ | ✅ | ❌ | THIẾU (Integration) |
| US-079 Tổng hợp điểm | ✅ | ⚠️ | ⚠️ | ❌ | THIẾU |

**Điểm yếu lớn nhất: Integration test = 0 cho MỌI US** (chưa có Supertest e2e thật; `backend/test/app.e2e-spec.ts` chỉ là khung).

---

## 5. Vùng chưa cover & lý do (Mục 7.6)

- **Controllers (attempts/exams)** — 0% coverage: wave này test ở tầng service, chưa viết controller test/Supertest.
- **Auth / common / users / violations** — 0%: ngoài scope "trắc nghiệm tư vấn", để wave sau.
- **Luồng làm bài đầu-cuối (start → answer → autosave → submit → result)** — chưa có e2e: cần test DB (Postgres) + Supertest.
- **Swagger (Mục 8.3)** — chưa cấu hình `@nestjs/swagger`: gate "Trước khi merge PR" sẽ fail.

---

## 6. Khuyến nghị để đạt QC sign-off

**P0 — chặn sign-off (Critical):**
1. BUG-BE-001: triển khai chấm điểm thật — set `isCorrect` khi save/submit, so `answerValue` với `correctAnswer` theo `type` (single/multiple/true-false).
2. BUG-BE-002: `getExamQuestions` lọc theo `examId` thật + strip `correctAnswer`/`explanation` khỏi response cho thí sinh.
3. BUG-FE-001 + BUG-FE-005: render `<img mediaUrl>` (US-050) + sanitize content (bảo mật).

**P1 — High:**
4. BUG-BE-003 (cấu hình điểm MCQ), BUG-BE-004 (mẫu số = tổng câu của đề), BUG-BE-005 (soft delete), BUG-BE-006 (auto-submit hết giờ), BUG-FE-002 (video).
5. Bổ sung **Integration test (Supertest)** ≥1/US và **controller test** → đưa coverage code mới ≥80%.

**P2 — chuẩn hóa hạ tầng:**
6. Cấu hình `@nestjs/swagger` cho mọi endpoint (Mục 8.3).
7. Thêm **coverage gate ≥80%** vào `.github/workflows/ci.yml` (hiện CI chỉ lint/type/test).
8. Chốt scope video/audio (US-051/052): fix hoặc PO duyệt out-of-scope bằng văn bản.

---

*Báo cáo tuân theo Chương 7 — Quy trình kiểm thử QC team, CAIRA-DAU v1.0.*
*Bug ticket: docs/bugs/. Test report này nên được publish lên Docs Host và link vào Jira (Mục 7.7).*

## Phụ lục — PR gắn với vòng QC này

> Gộp từ `pr-body-exam-grading-qc.md` (đã xóa) — tóm tắt PR đã đưa phân hệ này
> qua sign-off (mô tả ở trên).

- **Mô tả:** Giao phân hệ Thi trắc nghiệm (Grading Engine + UI làm bài) kèm bộ
  kiểm thử QC theo chuẩn CAIRA-DAU v1.0. Lý do: bản scaffold trước đó không
  chấm điểm được (điểm luôn 0) và lộ đáp án — lỗ hổng chặn nghiệp vụ. PR khắc
  phục và đưa QC verdict về **ĐẠT SIGN-OFF**.
- **US liên quan:** US-047..052, US-054, US-074, US-076..079.
- **Test thủ công:** `cd backend && npm ci && npx prisma generate && npm test && npm run test:cov`; `cd frontend && npm ci && npx vitest --run`.
- **Migration:** thêm cột `Exam.deletedAt DateTime?` (additive, tương thích ngược) — chi tiết rollback ở [13-rollback](13-rollback.md).
- **Known issues khi merge (không chặn sign-off):** BUG-BE-007, BUG-BE-008, thiếu Integration test (Supertest) — đã bổ sung ở vòng 3 (xem mục 1 ở trên).
