# 17 — Tích hợp nguồn câu hỏi/lịch thật: exam-core (KT&ĐBCL)

> EPIC-21 — thay nguồn câu hỏi MOCK bằng API thật của hệ Khảo thí & Đảm bảo
> chất lượng. Code theo **contract-first**: dựng theo đúng schema API thật, chạy
> bằng fixture khi chưa có token; có token chỉ cần đổi `.env`.

## 1. Nguồn API

- Swagger: `https://dau-api-dev.coregenaihub.com/docs/kt-dbcl`
- OpenAPI JSON: `…/docs/kt-dbcl-json`
- Base URL: `https://dau-api-dev.coregenaihub.com`, prefix `/api`
- Auth: **Bearer JWT** cho MỌI endpoint (không có endpoint login trong spec này —
  token lấy từ hệ Auth/SSO của coregenaihub, scope role `EXAM_QUALITY_*`).
  Gọi không token ⇒ **HTTP 401**.

## 2. Endpoint dùng

| Mục đích | Method + Path |
|---|---|
| Danh sách câu hỏi | `GET /api/exam-quality/question-bank/questions` |
| Chi tiết câu hỏi | `GET /api/exam-quality/question-bank/questions/{id}` |
| Đợt thi (lịch) | `GET /api/exam-quality/exam-core/exam-terms` |
| Ma trận đề | `GET /api/exam-quality/exam-paper/matrices` |

⚠️ **Không có endpoint "sinh/rút đề"** từ ma trận. Ma trận chỉ là *blueprint*
(`durationMinutes`, `totalPoints`, `bankId`…). Việc rút N câu theo ma trận thành
một đề cụ thể do **hệ thi tự làm**, hoặc chờ team backend bổ sung API.

## 3. Quy đổi loại câu (mapper)

| exam-core `type` | Điều kiện | Loại nội bộ | Tự chấm? |
|---|---|---|---|
| `TRAC_NGHIEM` | 1 `options[].isCorrect` | `SINGLE_CHOICE` | ✅ |
| `TRAC_NGHIEM` | ≥2 `options[].isCorrect` | `MULTIPLE_CHOICE` | ✅ (partial) |
| `DUNG_SAI` | `trueFalseAnswer` | `TRUE_FALSE` | ✅ |
| `TU_LUAN` | chỉ có `modelAnswer` | `ESSAY` | ❌ (chấm tay) |

- Đáp án: gán key `A,B,C…` theo `options[].order`; `correctAnswer` = key (SINGLE),
  mảng key (MULTIPLE), `'true'`/`'false'` (TRUE_FALSE), `null` (ESSAY).
- ⚠️ `options[].isCorrect` **lộ đáp án** trong API ⇒ phải snapshot ở server và
  **che khỏi payload gửi sinh viên** (đã có sẵn cơ chế `AttemptQuestion` + strip).

## 4. Kiến trúc (adapter, đổi nguồn bằng cờ)

```
ExamCoreController (read-only, ADMIN/EXAM_OFFICER)
        │
ExamCoreService (facade + mapper)
        │
ExamCoreClient (abstract)
   ├── ExamCoreMockClient  ← fixture, dùng khi CHƯA có token (mặc định)
   └── ExamCoreHttpClient  ← gọi HTTP thật, bật khi có token
```

Chọn nguồn trong `exam-core.module.ts` theo env:

| `EXAM_SOURCE` | `EXAM_CORE_TOKEN` | Nguồn |
|---|---|---|
| (trống) / `mock` | — | **Mock fixture** |
| `exam-core` | có | **HTTP thật** |
| `exam-core` | trống | tự lùi về Mock (an toàn) |

## 5. Bật LIVE khi có token

1. Xin Bearer token (scope `EXAM_QUALITY_*`) từ team coregenaihub.
2. Sửa `backend/.env`:
   ```
   EXAM_SOURCE=exam-core
   EXAM_CORE_TOKEN=<token>
   ```
3. Khởi động lại backend. Kiểm tra: `GET /api/v1/exam-core/source` → `{"source":"exam-core"}`.
4. Nếu hình dạng envelope danh sách khác dự đoán, chỉ sửa `toPaginated()` trong
   `exam-core.http.client.ts` (một chỗ duy nhất).

## 6. Endpoint xem trước (đã có)

`GET /api/v1/exam-core/{source|questions|schedules|matrices}` — chỉ ADMIN/EXAM_OFFICER,
câu hỏi **đã bỏ đáp án**. Dùng để khảo thí kiểm tra nguồn trước khi đưa vào đề thi.

## 7. Đã nối vào luồng thi (không cần token)

`ExamsService` chọn nguồn câu hỏi theo `EXAM_SOURCE`:

| `EXAM_SOURCE` | `getQuestionsWithAnswers` (snapshot) & `getExamQuestions` (thí sinh) |
|---|---|
| (trống) / `mock` | đọc `mock-api/questions.json` (như cũ) |
| `exam-core` | lấy từ `ExamCoreService` → fixture (chưa token) hoặc HTTP (có token) |

- Khi `EXAM_SOURCE=exam-core`: lúc `startExam` snapshot câu hỏi từ exam-core (đã map
  về `{options:{key,value}, correctAnswer}` khớp grading); câu **ESSAY/TU_LUAN bị loại**
  (chưa tự chấm) để chấm công bằng. Mapper đổi `DUNG_SAI`→`TRUE_FALSE` key `T/F`.
- `EXAM_CORE_BANK_ID` (tuỳ chọn): chỉ lấy câu từ một ngân hàng cụ thể.
- **Thử ngay không cần token:** đặt `EXAM_SOURCE=exam-core` (token trống ⇒ tự dùng
  fixture) rồi vào thi — đề sẽ là câu hỏi fixture exam-core thay vì mock-api.

### Bộ đề mẫu (fixture) — 46 câu, 4 ngân hàng

| Ngân hàng | `EXAM_CORE_BANK_ID` | Số câu | Ghi chú |
|---|---|---|---|
| Kỹ thuật lập trình C | `qb000001-aaaa-4bbb-cccc-ddddeeee0001` | 4 | gồm 1 tự luận (bị loại khi thi) |
| Lịch sử Đảng CSVN | `qb000002-aaaa-4bbb-cccc-ddddeeee0002` | 15 | trắc nghiệm + đúng/sai |
| Tiếng Anh | `qb000003-aaaa-4bbb-cccc-ddddeeee0003` | 15 | có 1 câu **nghe (AUDIO)** |
| Minh hoạ Hình/Video | `qb000004-aaaa-4bbb-cccc-ddddeeee0004` | 12 | mỗi câu kèm **IMAGE/VIDEO** |

- Không đặt `EXAM_CORE_BANK_ID` ⇒ lấy **cả 46 câu** (trộn môn). Muốn thi đúng 1 môn
  thì đặt `EXAM_CORE_BANK_ID` bằng mã ngân hàng tương ứng.
- 45/46 câu tự chấm được (1 câu tự luận thuộc bank C bị loại). 13 câu có media
  (hình/video/audio) để minh hoạ phần render đa phương tiện.

## 8. Liên kết đề ↔ nguồn & rút đề từ ma trận (EPIC-21)

`ExamDefinition` có 2 trường liên kết exam-core (Prisma):

| Trường | Ý nghĩa |
|---|---|
| `examCoreMatrixId` | **Ưu tiên** — rút đề theo **ma trận** (section × độ khó × loại) |
| `examCoreBankId` | Nếu không có matrix — lấy **cả ngân hàng** đó |
| *(không có cả hai)* | fallback `EXAM_CORE_BANK_ID` (env toàn cục) |

Thứ tự phân giải trong `ExamsService.resolveExamCoreQuestions(examId)`:
`examCoreMatrixId` → `examCoreBankId` → `EXAM_CORE_BANK_ID`. Luôn chỉ giữ câu **tự
chấm được** (loại tự luận — hệ chỉ trắc nghiệm).

### Rút đề từ ma trận (`ExamCoreService.assembleFromMatrix`)
- Lấy `ExamMatrixCell[]` (mỗi ô: `sectionId, difficulty, questionType, questionCount`).
- Mỗi ô rút đúng `questionCount` câu khớp (loại + độ khó + section nếu có), **không
  trùng** giữa các ô, theo `displayOrder`. Thiếu câu thì lấy hết phần có và **ghi log**.
- Fixture mẫu: ma trận **Lịch sử Đảng** (`MATRIX_ID.LSD`) rút 10 câu = 2 dễ + 5 TB +
  1 khó (trắc nghiệm) + 2 đúng/sai.

### Đặt liên kết qua API (khảo thí/admin)
`PATCH /api/v1/exam-definitions/:id/config` nhận thêm `examCoreBankId`,
`examCoreMatrixId` (chuỗi rỗng `""` ⇒ gỡ liên kết).

> Lưu ý: sau khi đổi `schema.prisma`, cần `prisma db push` (container dev tự chạy khi
> `docker compose restart backend`) để có 2 cột mới.

## 9. Còn lại (phase sau)
- Đọc `sectionId`/`bloomLevel` thật khi câu hỏi exam-core có gắn section.
- Random hoá lựa chọn trong mỗi ô theo từng lượt thi (hiện lấy ổn định theo thứ tự).
