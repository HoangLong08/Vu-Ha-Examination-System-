# 🐞 DEBUG_CHECKLIST.md

> Quy trình chuẩn debug cho CAIRA Examination System

---

# Mục tiêu

Không sửa code ngay.

Luôn:

Phân tích

↓

Tìm Root Cause

↓

Đề xuất Solution

↓

Code

↓

Test

---

# Bước 1. Đọc Business Rule

Đầu tiên phải xác định

Bug?

Hay đúng nghiệp vụ?

Đọc

- SRS
- User Story
- Acceptance Criteria
- API Contract

Ví dụ

Student hết lượt thi

↓

Backend trả 400

↓

Có phải Bug?

↓

Không.

Đúng nghiệp vụ FR-Q-003.

---

# Bước 2. Reproduce Bug

Luôn ghi lại

Environment

```
Frontend

Backend

Browser

Database

User Role

Exam

Attempt
```

Các bước

```
1.

2.

3.
```

Expected

```
...
```

Actual

```
...
```

---

# Bước 3. Mở công cụ Debug

Frontend

✅ Chrome DevTools

- Console

- Network

- Application

Backend

✅ Terminal

Database

✅ Prisma Studio

hoặc

pgAdmin

API

✅ Swagger

---

# Bước 4. Kiểm tra Request

Network

Ví dụ

```
POST

/api/v1/exams/:id/start
```

Kiểm tra

Method

Status

Payload

Response

Response Message

Response Code

---

# Bước 5. Kiểm tra Backend

Tìm

Controller

↓

Service

↓

Repository

↓

Database

Ví dụ

```
@Post()

↓

attempts.service.ts

↓

prisma.examAttempt

↓

PostgreSQL
```

---

# Bước 6. Kiểm tra Database

Xem dữ liệu

Ví dụ

ExamDefinition

```
maxAttempt
```

ExamAttempt

```
status

studentId

startedAt

submittedAt
```

Không đoán.

Luôn kiểm tra DB.

---

# Bước 7. Xác định Root Cause

Không ghi

"Sửa lỗi"

Phải ghi

Root Cause

Ví dụ

```
Frontend không bắt Business Error.

Backend hoạt động đúng.

400 là Expected Response.
```

---

# Bước 8. Đề xuất Solution

Ví dụ

Backend

- giữ nguyên

Frontend

- handle error

- modal

- không AxiosError

---

# Bước 9. Đánh giá ảnh hưởng

Kiểm tra

Recovery

Autosave

Submit

Review

Result

Navigation

Authentication

Không được Regression.

---

# Bước 10. Test

Backend

```
npm test
```

Frontend

```
npm test -- --run
```

TypeScript

```
npx tsc --noEmit
```

Lint

```
npm run lint
```

Manual Test

- Login

- Start

- Resume

- Submit

- Review

- Logout

---

# Quy trình Debug

```
Bug

↓

Reproduce

↓

Business Rule

↓

Network

↓

Backend

↓

Database

↓

Root Cause

↓

Solution

↓

Test

↓

Review

↓

Done
```

---

# Prompt Debug chuẩn

Task

Analyze the issue only.

Do NOT modify code.

Requirements

1.

Read Business Rule.

2.

Read related module.

3.

Find Root Cause.

4.

Explain why.

5.

Suggest Solution.

6.

Wait for confirmation.

---

# Checklist trước khi Code

□ Đã đọc SRS

□ Đã đọc Acceptance Criteria

□ Đã đọc API

□ Đã xem DB

□ Đã xem Network

□ Đã xem Backend Log

□ Đã xác định Root Cause

□ Đã xác định phạm vi sửa

□ Không ảnh hưởng module khác

---

# Checklist sau khi Code

□ Unit Test pass

□ Integration pass

□ TypeScript pass

□ ESLint pass

□ Manual QA pass

□ Không Regression

□ Không console.log

□ Không TODO

□ Không Dead Code

---

# Những lỗi thường gặp

## Frontend

- AxiosError

- Loading vô hạn

- State không reset

- Race Condition

- useEffect loop

- Missing dependency

- Promise chưa catch

- Unhandled rejection

---

## Backend

- BadRequestException

- Validation

- Prisma

- Transaction

- Auth Guard

- Permission

---

## Database

- Sai dữ liệu

- Migration

- Seed

- FK

- Unique

---

## Authentication

- JWT

- Refresh Token

- Expired Token

- Cookie

---

## Exam

- Start

- Resume

- Auto Save

- Submit

- Result

- Review

- Timeout

- Max Attempt

---

# Nguyên tắc Debug

❌ Không sửa khi chưa biết nguyên nhân.

❌ Không đoán.

❌ Không fix theo cảm tính.

✅ Luôn xác định Root Cause.

✅ Luôn đọc Business Rule.

✅ Luôn test sau khi sửa.

✅ Luôn nghĩ đến Regression.
