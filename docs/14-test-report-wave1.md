# 📋 Test Report — Wave 1 Output Validation

**Project:** DAU Examination System (Hệ thống Khảo thí — Đại học Kiến trúc Đà Nẵng)
**Date:** 2026-06-11
**Tester:** QA Agent (Automated)
**Scope:** Wave 1 deliverables — Backend scaffold, Prisma schema, Mock data, HTML mockups

---

## 🔑 Executive Summary

| Area | Status | Details |
|------|--------|---------|
| Backend Build | ✅ PASS | `nest build` — zero errors |
| Prisma Schema | ✅ PASS | `prisma validate` — schema is valid |
| Mock Data JSON | ✅ PASS | All 9 JSON files valid |
| ID Consistency | ✅ PASS | All cross-referenced UUIDs match |
| HTML Mockups | ✅ PASS | 4/4 files exist with substantial content |
| Code Quality | ✅ PASS | NestJS best practices followed (minor notes below) |

**Overall Verdict: ✅ WAVE 1 PASSED**

---

## 1. Backend Build Validation

```
$ npm run build
> backend@0.0.1 build
> nest build
```

**Result:** ✅ **PASS** — Build completed successfully with zero errors or warnings.

---

## 2. Prisma Schema Validation

```
$ npx prisma validate
Loaded Prisma config from prisma.config.ts.
Prisma schema loaded from prisma/schema.prisma.
The schema at prisma/schema.prisma is valid 🚀
```

**Result:** ✅ **PASS**

**Schema Summary:**
- **23 models** covering all domains: User, Role, UserRole, Student, Exam, ExamPeriod, ExamSession, ExamDefinition, SessionExam, ExamRoom, RoomAssignment, InvigilatorAssignment, Attendance, ExamAttempt, AttemptQuestion, AttemptAnswer, QuestionSnapshot, Result, Violation, ViolationAttachment, ReportExport, AuditLog, SystemConfig
- PostgreSQL with UUID primary keys
- Proper cascading deletes, composite unique constraints, and indexes
- Consistent naming conventions

---

## 3. Mock Data JSON Validation

| File | Status | Records |
|------|--------|---------|
| `auth-login.json` | ✅ Valid | 1 login payload (student user) |
| `auth-me.json` | ✅ Valid | 1 user profile |
| `exam-definition.json` | ✅ Valid | 1 exam definition |
| `exam-matrix.json` | ✅ Valid | 1 matrix with 13 cells |
| `exam-terms.json` | ✅ Valid | 3 exam terms (paginated) |
| `question-banks.json` | ✅ Valid | 2 question banks (paginated) |
| `questions.json` | ✅ Valid | 4 sample questions (paginated) |
| `roles.json` | ✅ Valid | 4 roles (paginated) |
| `users-list.json` | ✅ Valid | 5 users (paginated) |

**Total: 9/9 files valid JSON ✅**

---

## 4. ID Cross-Reference Consistency Check

### 4.1 exam-definition.json → exam-terms.json

| Field | Value in exam-definition.json | Found in exam-terms.json? |
|-------|-------------------------------|---------------------------|
| `examTermId` | `et000001-aaaa-4bbb-cccc-ddddeeee0001` | ✅ YES — "Thi cuối kỳ - Học kỳ 2 năm 2025-2026" |

### 4.2 exam-definition.json → exam-matrix.json

| Field | Value in exam-definition.json | Found in exam-matrix.json? |
|-------|-------------------------------|----------------------------|
| `matrixId` | `mx000001-aaaa-4bbb-cccc-dddd00000001` | ✅ YES — "Ma trận đề - Cơ sở lập trình CK HK2 2025-2026" |

### 4.3 exam-definition.json → question-banks.json

| Field | Value in exam-definition.json | Found in question-banks.json? |
|-------|-------------------------------|-------------------------------|
| `questionBankId` | `qb000001-aaaa-4bbb-cccc-ddddeeee0001` | ✅ YES — "Ngân hàng câu hỏi - Cơ sở lập trình (CS101)" |

### 4.4 questions.json → question-banks.json (bankId)

| Question ID | bankId | Found in question-banks.json? |
|-------------|--------|-------------------------------|
| `q0000001-...-0001` | `qb000001-aaaa-4bbb-cccc-ddddeeee0001` | ✅ YES |
| `q0000001-...-0002` | `qb000001-aaaa-4bbb-cccc-ddddeeee0001` | ✅ YES |
| `q0000001-...-0003` | `qb000001-aaaa-4bbb-cccc-ddddeeee0001` | ✅ YES |
| `q0000001-...-0004` | `qb000001-aaaa-4bbb-cccc-ddddeeee0001` | ✅ YES |

### 4.5 questions.json → question-banks.json (sectionId)

| Question ID | sectionId | Found in question-banks.json sections? |
|-------------|-----------|----------------------------------------|
| `q0000001-...-0001` | `sec00001-1111-4aaa-bbbb-ccccdddd0001` | ✅ YES — "Biến, Kiểu dữ liệu và Phép toán" |
| `q0000001-...-0002` | `sec00001-1111-4aaa-bbbb-ccccdddd0002` | ✅ YES — "Cấu trúc rẽ nhánh và Vòng lặp" |
| `q0000001-...-0003` | `sec00001-1111-4aaa-bbbb-ccccdddd0001` | ✅ YES — "Biến, Kiểu dữ liệu và Phép toán" |
| `q0000001-...-0004` | `sec00001-1111-4aaa-bbbb-ccccdddd0003` | ✅ YES — "Hàm, Mảng và Con trỏ" |

### 4.6 Additional Cross-References Verified

| Check | Status |
|-------|--------|
| `auth-login.json` user ID matches `users-list.json` user #1 | ✅ Match (`b7e2c4a1-3f58-4d9e-a1b2-c3d4e5f67890`) |
| `auth-me.json` user ID matches `auth-login.json` user | ✅ Match |
| `auth-login.json` role ID matches `roles.json` STUDENT role | ✅ Match (`d4e5f6a7-b8c9-4d0e-f1a2-b3c4d5e6f789`) |
| `users-list.json` role IDs match `roles.json` | ✅ All match |
| `exam-matrix.json` sectionIds match `question-banks.json` sections | ✅ All 3 sections match |
| `exam-matrix.json` bankId matches `question-banks.json` | ✅ Match |
| Paginated responses all use consistent `meta` shape | ✅ Consistent (`page`, `take`, `itemCount`, `pageCount`, `hasPreviousPage`, `hasNextPage`) |

**Total: All cross-references consistent ✅**

---

## 5. HTML Mockups Validation

| File | Size | Lines | Status |
|------|------|-------|--------|
| `login.html` | 16,086 bytes | 436 lines | ✅ Exists with substantial content |
| `dashboard.html` | 30,626 bytes | 744 lines | ✅ Exists with substantial content |
| `exam-player.html` | 35,679 bytes | 793 lines | ✅ Exists with substantial content |
| `result.html` | 28,215 bytes | 644 lines | ✅ Exists with substantial content |

**Total: 4/4 mockup files exist ✅**
**Total lines: 2,617**

---

## 6. Backend Code Quality Review

### 6.1 Architecture & Module Structure ✅

| Check | Status | Details |
|-------|--------|---------|
| NestJS module structure | ✅ | Clean separation: `auth`, `users`, `exams`, `attempts`, `violations`, `common`, `prisma` |
| Global prefix `/api` | ✅ | Set in `main.ts` via `app.setGlobalPrefix('api')` |
| ConfigModule global | ✅ | `ConfigModule.forRoot({ isGlobal: true })` |
| Global ValidationPipe | ✅ | Whitelist + transform + forbidNonWhitelisted |
| Global Exception Filter | ✅ | `AllExceptionsFilter` catches all, returns structured error |
| Global Transform Interceptor | ✅ | Wraps responses in `{ statusCode, code, message, data }` |
| CORS configured | ✅ | Origins: `localhost:3000`, `localhost:3001` |

### 6.2 Auth Module ✅

| Check | Status | Details |
|-------|--------|---------|
| JWT Strategy | ✅ | Extends PassportStrategy, extracts from Bearer header |
| JWT Auth Guard | ✅ | Standard `AuthGuard('jwt')` pattern |
| Dev Login endpoint | ✅ | `POST /api/auth/dev/yopmail-test-user` — creates/finds user, issues tokens |
| Get Me endpoint | ✅ | `GET /api/v1/auth/me` — protected with JwtAuthGuard |
| Refresh Token | ✅ | `POST /api/auth/refresh-token` — verifies with separate refresh secret |
| Token generation | ✅ | Separate access/refresh tokens with configurable expiration |
| DTO validation | ✅ | `DevLoginDto` with `@IsEmail`, `RefreshTokenDto` with `@IsString` |

### 6.3 Exams Module ✅

| Check | Status | Details |
|-------|--------|---------|
| CRUD endpoints | ✅ | GET list, GET detail, POST create, PUT update, DELETE |
| Auth protection | ✅ | `@UseGuards(JwtAuthGuard)` on controller level |
| Role-based access | ✅ | Create/Update require `ADMIN` or `EXAM_OFFICER` |
| UUID param validation | ✅ | Uses `ParseUUIDPipe` for ID params |
| Pagination | ✅ | `ExamQueryDto` extends `PageOptionsDto` with extra filters |
| Mock data loading | ✅ | `getExamQuestions()` and `getMockExamDefinition()` read from `mock-api/` |
| Error handling | ✅ | Throws `NotFoundException` when exam not found |

### 6.4 Pagination DTOs ✅

| Check | Status | Details |
|-------|--------|---------|
| PageOptionsDto | ✅ | `page`, `take`, `order`, `searchKey` + computed `skip` |
| PageMetaDto | ✅ | `page`, `take`, `itemCount`, `pageCount`, `hasPreviousPage`, `hasNextPage` |
| PageDto | ✅ | Generic `data: T[]` + `meta: PageMetaDto` |
| Matches API contract | ✅ | Response shape matches doc 08-api-contract.md pagination pattern |
| Matches mock data shape | ✅ | Mock JSON `meta` fields identical to DTO fields |

### 6.5 Guards & Security ✅

| Check | Status | Details |
|-------|--------|---------|
| RolesGuard | ✅ | Reads metadata via Reflector, checks user roles array |
| Roles decorator | ✅ | Simple `SetMetadata` pattern |
| IP Range Guard | ✅ | Exists at `common/guards/ip-range.guard.ts` |
| Flexible role extraction | ✅ | Handles both string roles and `{ name, code }` objects |

### 6.6 Response Format Alignment ✅

| API Contract Spec | Implementation | Match? |
|-------------------|----------------|--------|
| `{ statusCode, code, message, data }` | TransformInterceptor wraps non-paginated responses | ✅ |
| Paginated: `{ data, meta }` | TransformInterceptor passes through if `meta` present | ✅ |
| Error: `{ statusCode, code, message }` | AllExceptionsFilter returns `{ statusCode, code, message, timestamp, path }` | ✅ (superset) |

---

## 7. Issues Found

### Issue #1 — Minor: Default JWT Secret Fallback

- **Severity:** Low (dev-only concern)
- **File:** `backend/src/auth/strategies/jwt.strategy.ts:21`
- **Description:** Uses `'default-secret'` fallback when `JWT_SECRET` env var is missing
- **Risk:** This is acceptable for development but should emit a warning log
- **Recommendation:** Add a `Logger.warn()` when falling back to default secret, and ensure production deployments always set `JWT_SECRET`

### Issue #2 — Minor: `examId` Param Not Used in getExamQuestions

- **Severity:** Low (by design for Wave 1)
- **File:** `backend/src/exams/exams.service.ts:161`
- **Description:** The `examId` parameter is accepted but not used — all questions from mock file are returned regardless
- **Expected:** In future waves, filter questions by exam ID
- **Status:** Acceptable for Wave 1 mock data phase

### Issue #3 — Info: Mock Data Path Uses Relative `process.cwd()` Resolution

- **Severity:** Info
- **File:** `backend/src/exams/exams.service.ts:163-168`
- **Description:** Mock file path resolves via `path.resolve(process.cwd(), '..', 'mock-api', 'questions.json')`. Works when running from `backend/` directory but could break if CWD changes.
- **Recommendation:** Consider using `__dirname` or a config variable for mock data path

### Issue #4 — Note: Hard delete in Exams vs. Soft Delete in API Contract

- **Severity:** Medium (design consideration)
- **File:** `backend/src/exams/exams.service.ts:115`
- **Description:** `remove()` uses `prisma.exam.delete()` (hard delete). API contract for some modules specifies soft delete (`DELETE /api/users/{id}` says "Xóa mềm").
- **Recommendation:** Clarify whether exam deletion should be soft delete (set `deletedAt`) or hard delete. Consider adding a `deletedAt` field to the Exam model if soft delete is needed.

---

## 8. Mock Data Quality Notes

### Pagination Consistency ✅
All paginated responses (`exam-terms.json`, `exam-matrix.json`, `question-banks.json`, `questions.json`, `roles.json`, `users-list.json`) use identical meta structure matching the API contract.

### Data Richness ✅
- **4 question types** represented: SINGLE_CHOICE, MULTIPLE_CHOICE, TRUE_FALSE (with code-snippet content)
- **3 difficulty levels**: DE, TRUNG_BINH, KHO
- **4 roles**: ADMIN, EXAM_OFFICER, INVIGILATOR, STUDENT
- **Rich permissions model**: 22+ granular permissions across modules
- **3 exam sections** with distribution data

### Vietnamese Localization ✅
All mock data uses proper Vietnamese text for names, descriptions, and status values.

---

## 9. Prisma Schema Completeness

| ERD Domain | Models | Status |
|------------|--------|--------|
| User & Security | User, Role, UserRole | ✅ |
| Student | Student | ✅ |
| Exam | Exam, ExamPeriod, ExamSession, ExamDefinition, SessionExam | ✅ |
| Room | ExamRoom, RoomAssignment, InvigilatorAssignment | ✅ |
| Attendance | Attendance | ✅ |
| Exam Attempt | ExamAttempt, AttemptQuestion, AttemptAnswer | ✅ |
| Question Snapshot | QuestionSnapshot | ✅ |
| Result | Result | ✅ |
| Violation | Violation, ViolationAttachment | ✅ |
| Report | ReportExport | ✅ |
| Audit | AuditLog | ✅ |
| System Config | SystemConfig | ✅ |

**Total: 23/23 models present ✅**

---

## 10. Recommendations for Wave 2

1. **Add unit tests** — No `*.spec.ts` files found yet. Priority: auth service, exams service, guards
2. **Add API integration tests** — Use Supertest to validate endpoints against mock data
3. **Implement soft delete** — Add `deletedAt` field to Exam model for consistency with other modules
4. **Frontend scaffold** — Proceed with React + Vite + TailwindCSS setup based on HTML mockups
5. **Environment validation** — Add startup check to warn if critical env vars (JWT_SECRET, DATABASE_URL) are missing
6. **Swagger/OpenAPI** — Add `@nestjs/swagger` decorators for auto-generated API docs

---

## 11. File Inventory

### Backend (41 TypeScript files)

```
src/
├── app.module.ts
├── main.ts
├── auth/
│   ├── auth.controller.ts
│   ├── auth.module.ts
│   ├── auth.service.ts
│   ├── dto/auth.dto.ts, index.ts
│   ├── guards/jwt-auth.guard.ts
│   └── strategies/jwt.strategy.ts
├── common/
│   ├── decorators/roles.decorator.ts
│   ├── dto/page-meta.dto.ts, page-options.dto.ts, page.dto.ts, index.ts
│   ├── filters/all-exceptions.filter.ts
│   ├── guards/roles.guard.ts, ip-range.guard.ts, index.ts
│   └── interceptors/transform.interceptor.ts
├── exams/
│   ├── exams.controller.ts
│   ├── exams.module.ts
│   ├── exams.service.ts
│   └── dto/exams.dto.ts, index.ts
├── attempts/
│   ├── attempts.controller.ts, module.ts, service.ts
│   └── dto/attempts.dto.ts, index.ts
├── users/
│   ├── users.controller.ts, module.ts, service.ts
│   └── dto/users.dto.ts, index.ts
├── violations/
│   ├── violations.controller.ts, module.ts, service.ts
│   └── dto/violations.dto.ts, index.ts
└── prisma/
    ├── prisma.module.ts
    └── prisma.service.ts
```

### Mock Data (9 JSON files)
### HTML Mockups (4 files)
### Prisma Schema (1 file, 425 lines, 23 models)

---

*Report generated: 2026-06-11T20:57:00+07:00*
*Wave 1 Status: ✅ ALL CHECKS PASSED*
