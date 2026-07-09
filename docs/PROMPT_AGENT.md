# 🤖 PROMPT_AGENT.md

> Template chuẩn giao việc cho AI Agent trong dự án CAIRA Examination System.

---

# Quy tắc chung

Luôn mô tả theo thứ tự sau:

1. Context
2. Business Rule
3. Current Behavior
4. Expected Behavior
5. Scope
6. Constraints
7. Tests
8. Expected Result

Không bao giờ chỉ ghi:

> "Sửa lỗi này"

---

# Template chuẩn

## Context

Mô tả module.

Ví dụ

Project:
CAIRA Examination System

Module:
Exam / Attempt / Student

---

## Business Rule

Mô tả đúng nghiệp vụ.

Ví dụ

FR-Q-003

- Student chỉ được thi tối đa maxAttempt.
- Nếu còn IN_PROGRESS thì phải Resume.
- Nếu đã hết lượt thi thì không tạo Attempt mới.

Không được thay đổi Business Rule.

---

## Current Behavior

Mô tả lỗi hiện tại.

Ví dụ

Current Behavior

- Backend trả HTTP 400.
- Frontend hiện AxiosError.
- Người dùng không biết nguyên nhân.

---

## Expected Behavior

Ví dụ

Expected Behavior

- Không thay đổi Business Rule.
- Backend trả structured error.
- Frontend hiển thị modal thân thiện.
- Không hiện AxiosError.

---

## Scope

Backend

- attempts.service.ts
- attempts.controller.ts

Frontend

- useExamSession.ts
- page.tsx

Tests

- lifecycle.spec.ts
- useExamSession.test.tsx

---

## Constraints

Không được

❌ Thay đổi DB

❌ Thay đổi API Contract khác

❌ Thay đổi Grading

❌ Thay đổi Submit Flow

❌ Refactor toàn bộ module

Chỉ sửa đúng phạm vi.

---

## Tests

Yêu cầu Agent bổ sung test.

Ví dụ

Backend

- Jest pass

Frontend

- Vitest pass

TypeScript

- tsc --noEmit

ESLint

- npm run lint

---

## Expected Result

Ví dụ

Student hết lượt thi

↓

Modal

↓

Không load đề

↓

Không AxiosError

↓

Không Unhandled Promise

↓

Business Rule giữ nguyên

---

# Template Bug Fix

Task

Fix bug in Exam module.

Business Rules

- Keep existing business rules unchanged.

Current Behavior

...

Expected Behavior

...

Scope

Backend

Frontend

Tests

Constraints

Expected Result

---

# Template Feature

Task

Implement new feature.

Business Rules

...

Acceptance Criteria

...

Scope

Backend

Frontend

Tests

Expected Result

---

# Template Refactor

Task

Refactor module.

Requirements

- Do not change behavior.
- Improve readability.
- Reduce duplicated code.
- Keep existing tests passing.

---

# Prompt Debug

Task

Find root cause.

Requirements

- Do not modify code immediately.
- Analyze backend.
- Analyze frontend.
- Explain root cause.
- Propose solution.
- Wait for confirmation before coding.

---

# Prompt Review

Review the implementation.

Check

- Business Rule
- Logic
- Edge Cases
- Performance
- Security
- Tests
- Code Style

Do not modify code.

Only review.

---

# Prompt Generate Tests

Generate unit tests only.

Requirements

- Keep production code unchanged.
- Cover success case.
- Cover failure case.
- Cover edge cases.
- Minimum coverage 80%.

---

# Prompt Code Review Checklist

Trước khi hoàn thành task, Agent phải tự kiểm tra:

- Business Rule còn đúng.
- Không phá API cũ.
- Không thay đổi Database.
- Không tạo Regression.
- Không còn console.log.
- Không còn TODO.
- Không còn code chết.
- TypeScript pass.
- ESLint pass.
- Jest/Vitest pass.

---

# Quy trình làm việc với AI Agent

Đọc tài liệu

↓

Đọc SRS

↓

Đọc API

↓

Đọc module liên quan

↓

Phân tích nguyên nhân

↓

Đề xuất giải pháp

↓

Chờ xác nhận (nếu thay đổi nghiệp vụ)

↓

Code

↓

Viết test

↓

Tự review

↓

Hoàn thành

---

# Những câu cấm dùng với AI

❌ "Sửa đi."

❌ "Fix giúp."

❌ "Code luôn."

❌ "Làm đại."

Thay vào đó hãy mô tả đầy đủ Context + Business Rule + Expected Behavior.

---

# Tiêu chí đánh giá Agent

Một task chỉ được coi là hoàn thành khi:

✅ Business Rule đúng

✅ Không Regression

✅ Test pass

✅ TypeScript pass

✅ ESLint pass

✅ UX đúng

✅ Code dễ đọc

✅ Có giải thích thay đổi

✅ Có đề xuất test
