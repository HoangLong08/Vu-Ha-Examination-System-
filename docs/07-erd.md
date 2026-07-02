# 07-erd.md

# DAU Examination System

# Entity Relationship Design

Version 1.0

---

# 1. USER & SECURITY

## User

Thông tin người dùng đăng nhập.

Fields

* id
* username
* fullName
* email
* avatar
* status
* lastLoginAt
* createdAt
* updatedAt

Relations

* roles
* auditLogs

---

## Role

Vai trò hệ thống.

Examples

* STUDENT
* INVIGILATOR
* EXAM_OFFICER
* ADMIN

Fields

* id
* code
* name

---

## UserRole

Quan hệ N-N.

Fields

* userId
* roleId

---

# 2. STUDENT DOMAIN

## Student

Cache thông tin sinh viên từ UMS.

Fields

* id
* studentCode
* fullName
* email
* className
* facultyName
* status

Relations

* roomAssignments
* attendances
* examAttempts
* results

---

# 3. EXAM DOMAIN

## Exam

Kỳ thi.

Ví dụ

* Thi HK1
* Thi HK2
* Thi tốt nghiệp

Fields

* id
* code
* name
* academicYear
* semester
* startDate
* endDate
* status

---

## ExamPeriod

Đợt thi.

Fields

* id
* examId
* code
* name
* startDate
* endDate

---

## ExamSession

Ca thi.

Fields

* id
* periodId
* code
* name
* examDate
* startTime
* endTime
* durationMinutes
* status

---

## ExamDefinition

Bài thi.

Dữ liệu nhận từ API.

Fields

* id
* externalExamId
* code
* title
* durationMinutes
* totalQuestions
* sourceSystem

---

## SessionExam

Liên kết

Ca thi ↔ Bài thi

Fields

* id
* sessionId
* examDefinitionId

---

# 4. ROOM DOMAIN

## ExamRoom

Phòng thi.

Fields

* id
* code
* name
* capacity
* location

---

## RoomAssignment

Phân phòng sinh viên.

Fields

* id
* roomId
* studentId
* sessionId
* seatNumber
* machineNumber (gán máy thi tại phòng máy)

---

## InvigilatorAssignment

Phân công coi thi.

Fields

* id
* roomId
* invigilatorId
* sessionId

---

# 5. ATTENDANCE DOMAIN

## Attendance

Điểm danh.

Fields

* id
* studentId
* sessionId
* roomId

status

* PRESENT
* ABSENT
* LATE
* VIOLATION

attendanceAt
attendanceBy

---

# 6. EXAM ATTEMPT DOMAIN

## ExamAttempt

Phiên làm bài.

Fields

* id
* studentId
* sessionId
* examDefinitionId

status

* NOT_STARTED
* IN_PROGRESS
* SUBMITTED
* EXPIRED

startedAt
submittedAt

remainingSeconds
score

clientIp (IP của client làm bài để giới hạn trong phòng máy)
userAgent (thông tin trình duyệt làm bài để khóa bảo mật)

---

## AttemptQuestion

Snapshot câu hỏi.

Fields

* id
* attemptId

questionId

questionOrder

questionContent

questionType

questionSnapshot

---

## AttemptAnswer

Đáp án sinh viên.

Fields

* id
* attemptId
* questionId

answerValue

isCorrect

answeredAt

---

# 7. QUESTION SNAPSHOT DOMAIN

## QuestionSnapshot

Lưu bản sao câu hỏi.

Fields

* id

externalQuestionId

title

content

type

mediaUrl

correctAnswer

explanation

difficulty

sourceSystem

---

Lưu snapshot để:

* API đổi dữ liệu vẫn không ảnh hưởng bài thi cũ
* Phục vụ khiếu nại

---

# 8. RESULT DOMAIN

## Result

Kết quả thi.

Fields

* id

attemptId

studentId

examDefinitionId

totalQuestions

correctAnswers

wrongAnswers

score

grade

published

publishedAt

---

# 9. VIOLATION DOMAIN

## Violation

Vi phạm thi.

Fields

* id

studentId

sessionId

roomId

machineNumber (số máy xảy ra vi phạm)

type (ví dụ: TAB_SWITCH, SCREEN_EXIT, DEVICE_CHECK_FAIL)

description

recordedBy (tên giám thị hoặc SYSTEM tự ghi nhận)

recordedAt

---

## ViolationAttachment

Minh chứng.

Fields

* id

violationId

fileName

fileUrl

uploadedAt

---

# 10. REPORT DOMAIN

## ReportExport

Lịch sử xuất báo cáo.

Fields

* id

reportType

fileUrl

generatedBy

generatedAt

---

# 11. AUDIT DOMAIN

## AuditLog

Fields

* id

userId

action

entityType

entityId

oldValue

newValue

ipAddress

createdAt

---

# 12. SYSTEM CONFIG

## SystemConfig

Fields

* id

key

value

description

updatedAt

---

# TỔNG KẾT

Core Tables

1 User
2 Role
3 UserRole
4 Student

5 Exam
6 ExamPeriod
7 ExamSession
8 ExamDefinition
9 SessionExam

10 ExamRoom
11 RoomAssignment
12 InvigilatorAssignment

13 Attendance

14 ExamAttempt
15 AttemptQuestion
16 AttemptAnswer

17 QuestionSnapshot

18 Result

19 Violation
20 ViolationAttachment

21 ReportExport

22 AuditLog

23 SystemConfig

Tổng cộng:
23 bảng lõi
