# 04-epic-catalog.md

# DAU Examination System

# Epic Catalog

Version 1.0

---

# EPIC-01 AUTHENTICATION & SSO

## Mục tiêu

Cho phép người dùng đăng nhập bằng tài khoản trường thông qua SSO.

## Phạm vi

* Login SSO
* Logout
* User Profile
* Session Management
* Role Resolution

## Vai trò

* Student
* Invigilator
* Examination Officer
* Administrator

---

# EPIC-02 USER & ROLE MANAGEMENT

## Mục tiêu

Quản lý người dùng và phân quyền hệ thống.

## Phạm vi

* User
* Role
* Permission
* RBAC

---

# EPIC-03 STUDENT DASHBOARD

## Mục tiêu

Cung cấp giao diện làm việc cho sinh viên.

## Phạm vi

* Dashboard
* Thông tin cá nhân
* Lịch thi
* Kết quả thi

---

# EPIC-04 EXAM MANAGEMENT

## Mục tiêu

Quản lý kỳ thi.

## Phạm vi

* Kỳ thi
* Đợt thi
* Trạng thái kỳ thi

---

# EPIC-05 EXAM SESSION MANAGEMENT

## Mục tiêu

Quản lý ca thi.

## Phạm vi

* Tạo ca thi
* Mở ca thi
* Đóng ca thi
* Gia hạn ca thi

---

# EPIC-06 EXAM ROOM MANAGEMENT

## Mục tiêu

Quản lý phòng thi.

## Phạm vi

* Danh sách phòng
* Sức chứa
* Gán phòng thi

---

# EPIC-07 STUDENT ASSIGNMENT

## Mục tiêu

Phân công sinh viên vào phòng thi và gán máy thi phòng máy.

## Phạm vi

* Gán sinh viên
* Gán số báo danh
* Gán vị trí ngồi / số máy phòng thi (SV001 -> Máy 01)

---

# EPIC-08 INVIGILATOR ASSIGNMENT

## Mục tiêu

Phân công cán bộ coi thi.

## Phạm vi

* Gán cán bộ coi thi
* Quản lý phân công

---

# EPIC-09 ATTENDANCE MANAGEMENT

## Mục tiêu

Điểm danh sinh viên.

## Phạm vi

* Present
* Absent
* Late
* Violation

---

# EPIC-10 EXAM PLAYER

## Mục tiêu

Màn hình làm bài thi.

## Phạm vi

* Hiển thị câu hỏi
* Điều hướng câu hỏi
* Timer
* Review Question

---

# EPIC-11 QUESTION RENDERING

## Mục tiêu

Hiển thị nội dung câu hỏi.

## Phạm vi

* Single Choice
* Multiple Choice (Có cấu hình chấm điểm tuyệt đối hay từng phần)
* True/False
* Image
* Video
* Audio

---

# EPIC-12 ANSWER MANAGEMENT

## Mục tiêu

Quản lý đáp án sinh viên.

## Phạm vi

* Save Answer
* Update Answer
* Answer History

---

# EPIC-13 AUTO SAVE & RECOVERY

## Mục tiêu

Đảm bảo không mất dữ liệu bài làm.

## Phạm vi

* Auto Save (lưu định kỳ Client IndexedDB và Server)
* Recovery
* Reconnect & Sync

---

# EPIC-14 EXAM SESSION MONITORING

## Mục tiêu

Theo dõi trạng thái phòng thi.

## Phạm vi

* Online Status
* Attempt Status
* Connection Status

---

# EPIC-15 INVIGILATOR DASHBOARD

## Mục tiêu

Dashboard cho cán bộ coi thi.

## Phạm vi

* Danh sách sinh viên và gán số máy
* Trạng thái thi thời gian thực (Websocket)
* Cảnh báo mất kết nối, chuyển tab

---

# EPIC-16 SUBMISSION MANAGEMENT

## Mục tiêu

Nộp bài thi.

## Phạm vi

* Submit
* Auto Submit
* Submit Validation

---

# EPIC-17 GRADING ENGINE

## Mục tiêu

Chấm điểm tự động.

## Phạm vi

* Single Choice Grading
* Multiple Choice Grading (All-or-Nothing / Partial Credit)
* True/False Grading

---

# EPIC-18 RESULT MANAGEMENT

## Mục tiêu

Quản lý kết quả thi.

## Phạm vi

* Result
* Publish Result
* Result History

---

# EPIC-19 VIOLATION MANAGEMENT

## Mục tiêu

Quản lý vi phạm thi.

## Phạm vi

* Violation Record (Ghi nhận số máy, loại vi phạm)
* Evidence
* Violation History

---

# EPIC-20 REPORTING & STATISTICS

## Mục tiêu

Báo cáo và thống kê.

## Phạm vi

* Attendance Report
* Violation Report
* Result Report
* Exam Statistics

---

# EPIC-21 API INTEGRATION

## Mục tiêu

Tích hợp hệ thống bên ngoài.

## Phạm vi

### SSO

* Authentication
* Profile

### UMS

* Student
* Registration

### Exam Core

* Exam
* Questions
* Results

---

# EPIC-22 AUDIT LOGGING

## Mục tiêu

Theo dõi toàn bộ thao tác.

## Phạm vi

* Login Log
* Attempt Log (Lưu client IP, user agent)
* Submission Log
* Configuration Log

---

# EPIC-23 SYSTEM CONFIGURATION

## Mục tiêu

Cấu hình hệ thống.

## Phạm vi

* Exam Settings
* Security Settings (Cấu hình dải IP tĩnh phòng máy)
* Integration Settings

---

# EPIC-24 EXAM CONFIGURATION

## Mục tiêu

Cấu hình riêng cho từng bài thi.

## Phạm vi

* Show Result
* Show Answers
* Show Explanation
* Shuffle Question
* Shuffle Answer
* Max Attempt

---

# EPIC-25 BROWSER LOCKDOWN & LAB SECURITY

## Mục tiêu

Khóa bảo mật trình duyệt thi và ngăn chặn gian lận phòng máy.

## Phạm vi

* Fullscreen Detection & Lock
* Tab Switch Detection (Blur event)
* Window Blur Detection & Auto Block
* Safe Exam Browser (SEB) Integration

---

# Epic Priority

> Đồng bộ với phân kỳ ở [00-brief](00-brief.md) §5. Một số hạng mục **bên trong** epic MVP được
> đẩy V2 (ngoại lệ ghi rõ bên dưới).

## Phase 1 (MVP)

EPIC-01 → EPIC-18.

**Ngoại lệ đẩy V2 (dù epic thuộc MVP):** EPIC-11 — **Video (FR-F-007)** và **Audio (FR-F-008)**
trong câu hỏi → V2. V1 chỉ làm Single/Multiple/True-False + **Hình ảnh**.

---

## Phase 2

EPIC-19 → EPIC-25 (vi phạm, báo cáo, tích hợp API thật, audit, cấu hình, **bảo mật trình duyệt &
quản lý phòng máy** gồm SEB/chống chuyển-tab) + video/audio của EPIC-11.

---

# Tổng kết

Tổng số Epic: 25

MVP Epic: 18

Phase 2 Epic: 7

Các Epic này là cơ sở để sinh khoảng:

* 180–250 User Story
* 12–15 Sprint
* 300–500 Development Tasks

cho toàn bộ hệ thống.
