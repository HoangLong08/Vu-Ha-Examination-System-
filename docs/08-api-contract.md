# 08-api-contract.md

# DAU Examination System

# API CONTRACT

Version 1.1

> Cập nhật theo API thực tế: https://dau-api-dev.coregenaihub.com/docs

---

# API DESIGN PRINCIPLES

## Base URL

https://dau-api-dev.coregenaihub.com

---

## Protocol

HTTPS Only (WebSocket Secure for Real-time Feeds)

---

## Format

JSON (multipart/form-data cho upload file)

---

## Authentication

Bearer JWT

Example

Authorization: Bearer <access_token>

---

## Pagination Pattern

Request: `?page=1&take=10&order=ASC|DESC&searchKey=...`

Response:

{
  "data": [...],
  "meta": {
    "page": 1,
    "take": 10,
    "itemCount": 50,
    "pageCount": 5,
    "hasPreviousPage": false,
    "hasNextPage": true
  }
}

---

## Response Format

Success

{
  "statusCode": 200,
  "code": "SUCCESS",
  "message": "",
  "data": {}
}

Error

{
  "statusCode": 400,
  "code": "ERROR_CODE",
  "message": "Mô tả lỗi"
}

---

# MODULE 01 — AUTHENTICATION (Cổng chính IAM/SSO)

## POST /api/auth/social/sign-in

Đăng nhập bằng Google hoặc Microsoft.

Request

{
  "provider": "google",
  "idToken": "<google_id_token>"
}

Response (LoginPayloadDto)

{
  "user": {
    "id": "uuid",
    "email": "sv001@dau.edu.vn",
    "firstName": "Văn A",
    "lastName": "Nguyễn",
    "avatar": null,
    "gender": "MALE",
    "role": "ADMIN",
    "roles": [{ "id": "uuid", "name": "STUDENT", "isSystem": true }],
    "isActive": true,
    "lastLogin": "2026-06-15T07:00:00Z",
    "lastLoginIp": "192.168.1.101"
  },
  "token": {
    "expiresIn": 3600,
    "accessToken": "<jwt>",
    "refreshToken": "<refresh_jwt>"
  }
}

---

## GET /api/v1/auth/me

Lấy thông tin người dùng hiện tại.

Response (UserDto)

{
  "id": "uuid",
  "email": "sv001@dau.edu.vn",
  "firstName": "Văn A",
  "lastName": "Nguyễn",
  "role": "ADMIN",
  "roles": [{ "id": "uuid", "name": "STUDENT" }],
  "isActive": true,
  "phoneNumber": "0905123456",
  "address": "Đà Nẵng"
}

---

## POST /api/auth/refresh-token

Làm mới access token.

Header: Authorization: Bearer <refresh_token>

Response (TokenPayloadDto)

{
  "expiresIn": 3600,
  "accessToken": "<new_jwt>",
  "refreshToken": "<new_refresh_jwt>"
}

---

# MODULE 02 — RBAC (Vai trò & Quyền)

## GET /api/roles

Danh sách vai trò kèm toàn bộ quyền.

Query: searchKey (lọc theo tên, ILIKE)

Response

[
  {
    "id": "uuid",
    "name": "EXAM_OFFICER",
    "description": "Cán bộ khảo thí",
    "isSystem": false,
    "permissions": [
      { "id": "uuid", "module": "EXAM_QUALITY", "name": "EXAM_QUALITY_EXAM_CORE_VIEW" }
    ],
    "activeUserCount": 5,
    "inactiveUserCount": 1
  }
]

---

## POST /api/roles

Tạo vai trò tùy chỉnh.

Request (CreateRoleDto)

{
  "name": "INVIGILATOR",
  "description": "Cán bộ coi thi"
}

---

## POST /api/roles/{id}/permissions

Gán quyền cho vai trò (replace toàn bộ).

Request

{
  "permissionIds": ["uuid1", "uuid2"]
}

---

## GET /api/permissions

Danh sách toàn bộ quyền hệ thống.

---

## GET /api/permissions/{module}

Danh sách quyền theo module (ví dụ: EXAM_QUALITY).

---

## POST /api/users/{id}/roles

Gán vai trò cho người dùng.

Request

{
  "roleIds": ["uuid1"]
}

---

# MODULE 03 — USER MANAGEMENT

## GET /api/users

Danh sách người dùng (phân trang).

Query: page, take, order (ASC|DESC), sortBy (CREATED_AT|NAME), searchKey, role, isActive, startDate, endDate

Response: Paginated UserDto[]

---

## POST /api/users

Tạo người dùng (email + roleIds).

Request (CreateUserDto)

{
  "email": "giaovien@dau.edu.vn",
  "roleIds": ["uuid-role-invigilator"]
}

---

## GET /api/users/{id}

Chi tiết người dùng.

---

## PATCH /api/users/profile

Cập nhật hồ sơ (multipart/form-data: firstName, lastName, phoneNumber, address, avatar).

---

## PATCH /api/users/{id}/active

Kích hoạt/vô hiệu hóa tài khoản.

Request

{
  "isActive": false
}

---

## DELETE /api/users/{id}

Xóa mềm người dùng (soft delete).

---

# MODULE 04 — EXAM TERM (Đợt thi)

Base path: /api/exam-quality/exam-core/exam-terms

## GET /api/exam-quality/exam-core/exam-terms

Danh sách đợt thi (phân trang, lọc theo học kỳ/loại/trạng thái).

Query: semesterId, examType (GIUA_KY|CUOI_KY), status (DU_THAO|DANG_MO|DA_DONG), page, take

---

## POST /api/exam-quality/exam-core/exam-terms

Tạo đợt thi (status khởi tạo: DU_THAO).

Request (CreateExamTermDto)

{
  "semesterId": "uuid",
  "examType": "CUOI_KY",
  "code": "DT-2026-HK2-CK",
  "name": "Đợt thi cuối kỳ HK2 2025-2026",
  "startDate": "2026-06-15",
  "endDate": "2026-06-30"
}

---

## GET /api/exam-quality/exam-core/exam-terms/{id}

Chi tiết đợt thi.

---

## PATCH /api/exam-quality/exam-core/exam-terms/{id}

Cập nhật đợt thi (tên/ngày). Không sửa khi DA_DONG.

---

## DELETE /api/exam-quality/exam-core/exam-terms/{id}

Xóa mềm đợt thi (chỉ khi DU_THAO).

---

## POST /api/exam-quality/exam-core/exam-terms/{id}/open

Mở đợt thi: DU_THAO → DANG_MO.

---

## POST /api/exam-quality/exam-core/exam-terms/{id}/close

Đóng đợt thi: DANG_MO → DA_DONG.

---

# MODULE 05 — QUESTION BANK (Ngân hàng câu hỏi)

Base path: /api/exam-quality/question-bank

## GET /api/exam-quality/question-bank/banks

Danh sách ngân hàng câu hỏi (phân trang, lọc q/status/examFormat).

---

## POST /api/exam-quality/question-bank/banks

Tạo ngân hàng câu hỏi (mặc định trạng thái Đăng ký).

---

## GET /api/exam-quality/question-bank/banks/{id}

Chi tiết ngân hàng câu hỏi.

---

## POST /api/exam-quality/question-bank/banks/{id}/advance

Chuyển trạng thái bộ sang bước kế tiếp.

---

## GET /api/exam-quality/question-bank/banks/{bankId}/sections

Danh sách Phần/Chương của ngân hàng.

---

## POST /api/exam-quality/question-bank/banks/{bankId}/sections

Thêm Phần/Chương vào ngân hàng.

---

## GET /api/exam-quality/question-bank/questions

Danh sách câu hỏi (lọc bankId/type/difficulty/status/sectionId).

Query: bankId, searchKey, type (TRAC_NGHIEM_1|TRAC_NGHIEM_N|DUNG_SAI), difficulty, status, sectionId, page, take

---

## POST /api/exam-quality/question-bank/questions

Soạn câu hỏi mới (status Nháp, mã tự sinh).

---

## GET /api/exam-quality/question-bank/questions/{id}

Chi tiết câu hỏi.

---

## PATCH /api/exam-quality/question-bank/questions/{id}

Sửa câu hỏi (chỉ khi Nháp/Hiệu chỉnh).

---

## POST /api/exam-quality/question-bank/questions/{id}/submit-review

Gửi phản biện: Nháp/Hiệu chỉnh → Chờ phản biện.

---

## POST /api/exam-quality/question-bank/questions/import/preview

Xem trước import câu hỏi (dán văn bản, không lưu).

---

## POST /api/exam-quality/question-bank/questions/import

Import câu hỏi (tạo các câu hợp lệ, status Nháp).

---

# MODULE 06 — EXAM MATRIX (Ma trận đề)

Base path: /api/exam-quality/exam-paper/matrices

## GET /api/exam-quality/exam-paper/matrices

Danh sách ma trận đề (lọc courseId/bankId/status/examType).

---

## POST /api/exam-quality/exam-paper/matrices

Tạo ma trận (code MT- tự sinh, status NHAP).

---

## GET /api/exam-quality/exam-paper/matrices/{id}

Chi tiết ma trận.

---

## POST /api/exam-quality/exam-paper/matrices/{id}/submit

Đề xuất duyệt (validate tổng điểm + số câu).

---

## POST /api/exam-quality/exam-paper/matrices/{id}/approve

Duyệt ma trận: CHO_DUYET → DA_DUYET.

---

## POST /api/exam-quality/exam-paper/matrices/{id}/reject

Không duyệt (bắt buộc lý do): → TU_CHOI.

Request

{
  "reason": "Chưa đủ số câu khó"
}

---

## POST /api/exam-quality/exam-paper/matrices/{id}/lock

Khóa ma trận: DA_DUYET → KHOA (không mở lại).

---

## POST /api/exam-quality/exam-paper/matrices/{id}/clone

Nhân bản ma trận (từ DA_DUYET/KHOA → bản NHAP version+1).

---

## GET /api/exam-quality/exam-paper/matrices/{id}/cells

Danh sách ô của ma trận (kèm số câu khả dụng).

---

# MODULE 07 — EXAM ATTEMPT & PRE-CHECK

> Các API này thuộc phân hệ thi trắc nghiệm (chưa có trên API dev, sẽ mock)

## POST /api/v1/exams/{examId}/check-device

Ghi nhận kết quả tự kiểm tra thiết bị (Pre-exam check).

> **Lưu ý:** Giao diện kiểm tra thiết bị **đã được BỎ** ở bản hiện tại (sinh viên
> vào thi trực tiếp). Endpoint vẫn còn nhưng **chưa được frontend gọi** — giữ để
> có thể bật lại khi triển khai phòng lab thực tế.

Request

{
  "browserCompatible": true,
  "audioFunctional": true,
  "pingStable": true
}

---

## POST /api/v1/exams/{examId}/start

Khởi tạo phiên thi. Ghi nhận IP Client và User Agent.

Response

{
  "attemptId": "uuid",
  "startedAt": "2026-06-15T07:00:00Z"
}

---

## GET /api/v1/exams/{examId}/attempt

Lấy trạng thái bài thi.

---

## GET /api/v1/exams/{examId}/questions

Lấy danh sách câu hỏi cho bài thi.

---

# MODULE 08 — ANSWER MANAGEMENT

## POST /api/v1/attempts/{attemptId}/answers

Lưu đáp án.

Request

{
  "questionId": "uuid",
  "answer": "A"
}

---

## GET /api/v1/attempts/{attemptId}/answers

Lấy toàn bộ đáp án đã trả lời.

---

# MODULE 09 — AUTO SAVE & RECOVERY

## POST /api/v1/attempts/{attemptId}/autosave

Lưu định kỳ toàn bộ trạng thái.

Request

{
  "answers": [
    {
      "questionId": "uuid",
      "answer": "A",
      "timestamp": "2026-06-15T07:14:55Z"
    }
  ]
}

---

## GET /api/v1/attempts/{attemptId}/recovery

Khôi phục bài thi.

---

# MODULE 10 — SUBMISSION

## POST /api/v1/attempts/{attemptId}/submit

Nộp bài thi.

---

# MODULE 11 — RESULT

## GET /api/v1/results/{attemptId}

Kết quả bài thi.

---

## GET /api/v1/student/results

Danh sách kết quả (lịch sử thi).

---

# MODULE 12 — ATTENDANCE & LAB ASSIGNMENT

## GET /api/v1/invigilator/rooms/{roomId}/students

Danh sách sinh viên phòng thi.

---

## POST /api/v1/invigilator/rooms/{roomId}/assignments/machines

Gán số máy thi tĩnh cho sinh viên.

---

## POST /api/v1/attendance

Điểm danh.

---

# MODULE 13 — INVIGILATOR DASHBOARD & REALTIME

## GET /api/v1/invigilator/rooms/{roomId}/monitor

Danh sách trạng thái sinh viên.

---

## WS /ws/v1/invigilator/rooms/{roomId}/monitor

Kênh WebSocket giám sát thời gian thực.

Server Push Event

{
  "event": "STUDENT_STATUS_CHANGE",
  "data": {
    "studentCode": "SV001",
    "machineNumber": "Máy 01",
    "status": "DISCONNECTED"
  }
}

---

## GET /api/v1/invigilator/rooms/{roomId}/statistics

Thống kê phòng thi.

---

# MODULE 14 — VIOLATION

## POST /api/v1/violations

Ghi nhận vi phạm (hệ thống tự động hoặc giám thị).

---

## POST /api/v1/violations/{id}/attachments

Upload minh chứng.

---

# MODULE 15 — EXAM MANAGEMENT

## CRUD /api/v1/exams

Quản lý kỳ thi (GET list, POST create, PUT update, DELETE).

---

# MODULE 16 — SESSION MANAGEMENT

## POST /api/v1/sessions

Tạo ca thi.

---

## POST /api/v1/sessions/{id}/open

Mở ca thi.

---

## POST /api/v1/sessions/{id}/close

Đóng ca thi.

---

## POST /api/v1/sessions/{id}/extend

Gia hạn thời gian thi.

---

# MODULE 17 — REPORTS

## GET /api/v1/reports/attendance

Xuất danh sách điểm danh.

---

## GET /api/v1/reports/violations

Xuất danh sách vi phạm.

---

## GET /api/v1/reports/results

Xuất kết quả thi.

---

# EXTERNAL API INTEGRATION

## Cổng chính (IAM/SSO)

Base: https://dau-api-dev.coregenaihub.com

* POST /api/auth/social/sign-in
* GET /api/v1/auth/me
* GET /api/users
* GET /api/roles
* GET /api/permissions

---

## KT&ĐBCL (Khảo thí & Đảm bảo chất lượng)

Base: https://dau-api-dev.coregenaihub.com

* GET /api/exam-quality/exam-core/exam-terms
* GET /api/exam-quality/question-bank/banks
* GET /api/exam-quality/question-bank/questions
* GET /api/exam-quality/exam-paper/matrices

---

# API SUMMARY

| Module | Loại | Số endpoint |
|--------|------|-------------|
| Authentication | Cổng chính (thực tế) | 3 |
| RBAC | Cổng chính (thực tế) | 10+ |
| User Management | Cổng chính (thực tế) | 6 |
| Exam Term | KT&ĐBCL (thực tế) | 7 |
| Question Bank | KT&ĐBCL (thực tế) | 12+ |
| Exam Matrix | KT&ĐBCL (thực tế) | 10+ |
| Exam Attempt | Phân hệ thi (mock) | 4 |
| Answer Management | Phân hệ thi (mock) | 2 |
| Auto Save & Recovery | Phân hệ thi (mock) | 2 |
| Submission | Phân hệ thi (mock) | 1 |
| Result | Phân hệ thi (mock) | 2 |
| Attendance & Lab | Phân hệ thi (mock) | 3 |
| Invigilator Dashboard | Phân hệ thi (mock) | 3 + WS |
| Violation | Phân hệ thi (mock) | 2 |
| Session Management | Phân hệ thi (mock) | 4 |
| Reports | Phân hệ thi (mock) | 3 |

**Tổng cộng: ~70+ API endpoints**

* API thực tế (đã triển khai trên dev): Auth, RBAC, Users, ExamTerm, QuestionBank, ExamMatrix
* API mock (phân hệ thi trắc nghiệm): Exam Attempt, Answer, AutoSave, Submission, Result, Attendance, Invigilator, Violation
