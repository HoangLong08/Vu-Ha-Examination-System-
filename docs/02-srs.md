# 02-srs.md

# SOFTWARE REQUIREMENTS SPECIFICATION

# DAU EXAMINATION SYSTEM

## Version 1.0

---

# 1. INTRODUCTION

## 1.1 Purpose

Tài liệu này mô tả các yêu cầu chức năng và phi chức năng của Phân hệ Thi Trắc nghiệm Trực tuyến thuộc Hệ thống Khảo thí Trường Đại học Kiến trúc Đà Nẵng.

Mục đích của hệ thống là cung cấp môi trường tổ chức thi trên máy tính cho sinh viên, hỗ trợ công tác coi thi, giám sát thi và quản lý kết quả thi.

Hệ thống tích hợp với các hệ thống hiện có thông qua API và không chịu trách nhiệm quản lý chương trình đào tạo hay ngân hàng câu hỏi gốc.

---

## 1.2 Scope

Hệ thống bao gồm:

* Đăng nhập SSO
* Đồng bộ dữ liệu từ UMS
* Quản lý kỳ thi
* Quản lý ca thi
* Quản lý phòng thi
* Điểm danh
* Thực hiện bài thi
* Giám sát thi
* Chấm điểm tự động
* Công bố kết quả
* Báo cáo thống kê
* Quản lý thiết bị phòng máy và bảo mật phòng thi

Không bao gồm:

* Quản lý chương trình đào tạo
* Quản lý học phần
* Quản lý ngân hàng câu hỏi
* Quản lý đề cương học phần
* LMS

---

## 1.3 User Roles

### Student

Sinh viên tham gia thi.

### Invigilator

Cán bộ coi thi.

### Examination Officer

Cán bộ khảo thí.

### Administrator

Quản trị hệ thống.

---

# 2. SYSTEM CONTEXT

## 2.1 External Systems

### UMS

Cung cấp:

* Sinh viên
* Lớp học phần
* Đăng ký học phần

### SSO

Cung cấp:

* Xác thực
* Hồ sơ người dùng

### Exam Core API

Cung cấp:

* Kỳ thi
* Cấu hình bài thi
* Đề thi
* Câu hỏi

---

## 2.2 Integration Overview

```text
UMS
    ↓
SSO
    ↓
Exam Core API
    ↓
DAU Examination System
```

---

# 3. FUNCTIONAL REQUIREMENTS

# MODULE A - AUTHENTICATION

## FR-A-001

Hệ thống phải hỗ trợ đăng nhập thông qua SSO.

---

## FR-A-002

Sau khi xác thực thành công hệ thống phải lấy:

* UserId
* StudentCode
* FullName
* Email

---

## FR-A-003

Hệ thống phải tự động tạo hồ sơ người dùng nếu chưa tồn tại.

---

## FR-A-004

Hệ thống phải hỗ trợ đăng xuất.

---

## FR-A-005

Hệ thống phải ghi nhận lịch sử đăng nhập.

---

# MODULE B - EXAM SCHEDULE

## FR-B-001

Sinh viên phải xem được danh sách kỳ thi.

---

## FR-B-002

Mỗi kỳ thi phải hiển thị:

* Tên học phần
* Ngày thi
* Ca thi
* Phòng thi
* Số báo danh

---

## FR-B-003

Hệ thống phải hiển thị trạng thái:

* Chưa mở
* Được phép vào thi
* Đang thi
* Đã kết thúc

---

## FR-B-004

Sinh viên chỉ được xem các kỳ thi được phân công.

---

# MODULE C - EXAM SESSION

## FR-C-001

Khảo thí phải tạo được kỳ thi.

---

## FR-C-002

Khảo thí phải tạo được đợt thi.

---

## FR-C-003

Khảo thí phải tạo được ca thi.

---

## FR-C-004

Khảo thí phải cấu hình:

* Ngày thi
* Giờ bắt đầu
* Giờ kết thúc

---

## FR-C-005

Khảo thí phải mở ca thi.

---

## FR-C-006

Khảo thí phải đóng ca thi.

---

## FR-C-007

Khảo thí phải gia hạn thời gian thi.

---

# MODULE D - EXAM ROOM

## FR-D-001

Hệ thống phải quản lý danh sách phòng thi.

---

## FR-D-002

Mỗi phòng thi phải có:

* Mã phòng
* Tên phòng
* Sức chứa

---

## FR-D-003

Hệ thống phải quản lý danh sách sinh viên của từng phòng.

---

## FR-D-004

Hệ thống phải quản lý cán bộ coi thi của từng phòng.

---

## FR-D-005

Hệ thống phải hiển thị sơ đồ phòng thi.

---

# MODULE E - ATTENDANCE

## FR-E-001

Cán bộ coi thi phải điểm danh sinh viên.

---

## FR-E-002

Trạng thái điểm danh gồm:

* Present
* Absent
* Late
* Violation

---

## FR-E-003

Sinh viên vắng mặt phải bị khóa quyền vào thi.

---

## FR-E-004

Hệ thống phải lưu thời gian điểm danh.

---

## FR-E-005

Hệ thống phải lưu người thực hiện điểm danh.

---

# MODULE F - EXAM PLAYER

## FR-F-001

Sinh viên chỉ được bắt đầu thi khi ca thi được mở.

---

## FR-F-002

Hệ thống phải hiển thị nội dung câu hỏi.

---

## FR-F-003

Hệ thống phải hỗ trợ Single Choice.

---

## FR-F-004

Hệ thống phải hỗ trợ Multiple Choice.

---

## FR-F-005

Hệ thống phải hỗ trợ True/False.

---

## FR-F-006

Hệ thống phải hỗ trợ hình ảnh.

---

## FR-F-007

Hệ thống phải hỗ trợ video.

---

## FR-F-008

Hệ thống phải hỗ trợ âm thanh.

---

## FR-F-009

Hệ thống phải hiển thị thời gian còn lại.

---

## FR-F-010

Hệ thống phải hỗ trợ điều hướng câu hỏi.

---

## FR-F-011

Hệ thống phải hỗ trợ đánh dấu câu hỏi cần xem lại.

---

## FR-F-012

Hệ thống phải hiển thị số câu đã trả lời.

---

## FR-F-013

Hệ thống phải hiển thị số câu chưa trả lời.

---

# MODULE G - ANSWER MANAGEMENT

## FR-G-001

Hệ thống phải lưu đáp án ngay khi sinh viên chọn hoặc thay đổi đáp án.

---

## FR-G-002

Mỗi lần lưu phải ghi nhận:

* StudentId
* ExamAttemptId
* QuestionId
* AnswerValue
* Timestamp

---

## FR-G-003

Đối với Multiple Choice, hệ thống phải lưu toàn bộ danh sách đáp án được chọn. Chế độ chấm câu hỏi nhiều đáp án được cấu hình theo 2 cách: Chấm điểm tuyệt đối (All-or-Nothing) hoặc Tính điểm từng phần theo đáp án đúng (Partial Credit).

---

## FR-G-004

Sinh viên được phép thay đổi đáp án trước khi nộp bài.

---

## FR-G-005

Sau khi nộp bài, hệ thống không cho phép thay đổi đáp án.

---

# MODULE H - AUTO SAVE & RECOVERY

## FR-H-001

Hệ thống phải tự động lưu bài làm định kỳ vào cơ sở dữ liệu và lưu tạm thời tại máy Client (sử dụng IndexedDB) để đề phòng mất mạng đột ngột.

---

## FR-H-002

Chu kỳ Auto Save mặc định là 30 giây.

---

## FR-H-003

Hệ thống phải tự động đồng bộ dữ liệu local lên server khi kết nối được khôi phục. Trong trường hợp xung đột dữ liệu, hệ thống ưu tiên đáp án có Timestamp mới nhất.

---

## FR-H-004

Nếu trình duyệt bị đóng ngoài ý muốn, sinh viên đăng nhập lại phải tiếp tục được bài thi.

---

## FR-H-005

Hệ thống phải phục hồi:

* Đáp án đã chọn
* Thời gian còn lại
* Trạng thái bài thi

---

# MODULE I - INVIGILATOR DASHBOARD

## FR-I-001

Cán bộ coi thi phải xem được danh sách sinh viên trong phòng.

---

## FR-I-002

Mỗi sinh viên phải hiển thị:

* Mã sinh viên
* Họ tên
* Số báo danh
* Trạng thái thi

---

## FR-I-003

Trạng thái thi gồm:

* Not Joined
* Connected
* Taking Exam
* Submitted
* Disconnected

---

## FR-I-004

Dashboard phải cập nhật thời gian thực thông qua kết nối Websocket/SSE.

---

## FR-I-005

Hệ thống phải hiển thị số sinh viên:

* Chưa vào thi
* Đang thi
* Đã nộp bài
* Mất kết nối

---

## FR-I-006

Cán bộ coi thi phải xem được thời gian còn lại của từng sinh viên.

---

## FR-I-007

Hệ thống phải cảnh báo sinh viên mất kết nối.

---

## FR-I-008

Hệ thống phải cảnh báo sinh viên đăng nhập muộn.

---

# MODULE J - SUBMISSION

## FR-J-001

Sinh viên phải được phép nộp bài thủ công.

---

## FR-J-002

Trước khi nộp bài hệ thống phải hiển thị xác nhận.

---

## FR-J-003

Hệ thống phải hiển thị:

* Số câu chưa làm
* Số câu đã làm

---

## FR-J-004

Khi hết thời gian hệ thống phải tự động nộp bài.

---

## FR-J-005

Sau khi nộp bài trạng thái bài thi chuyển sang Submitted.

---

## FR-J-006

Sau khi nộp bài hệ thống phải khóa toàn bộ thao tác chỉnh sửa.

---

# MODULE K - GRADING

## FR-K-001

Hệ thống phải hỗ trợ chấm điểm tự động.

---

## FR-K-002

Single Choice được chấm theo đáp án đúng duy nhất.

---

## FR-K-003

Multiple Choice được chấm theo tập đáp án đúng.

---

## FR-K-004

True/False được chấm theo giá trị đúng sai.

---

## FR-K-005

Hệ thống phải tính:

* Tổng điểm
* Số câu đúng
* Số câu sai

---

## FR-K-006

Kết quả chấm điểm phải được lưu vào cơ sở dữ liệu.

---

# MODULE L - RESULT

## FR-L-001

Sinh viên xem được kết quả (điểm + đáp án) **ngay sau khi nộp bài** nếu đề thi bật cấu hình `showResult` (mặc định bật). Nếu khảo thí **tắt** `showResult`, hệ thống chỉ hiển thị thông báo "đã hoàn thành bài thi" và **giấu điểm/đáp án**. Khảo thí/Admin xem được kết quả mọi lúc.

---

## FR-L-002

Kết quả phải hiển thị:

* Điểm số
* Số câu đúng
* Số câu sai
* Thời gian làm bài

---

## FR-L-003

Khảo thí được cấu hình:

* Hiện đáp án
* Ẩn đáp án

---

## FR-L-004

Khảo thí được cấu hình:

* Hiện giải thích đáp án
* Ẩn giải thích đáp án

---

## FR-L-005

Sinh viên phải xem được lịch sử thi.

---

# MODULE M - VIOLATION MANAGEMENT

## FR-M-001

Cán bộ coi thi phải ghi nhận vi phạm.

---

## FR-M-002

Mỗi vi phạm gồm:

* Loại vi phạm
* Mô tả
* Thời gian
* Người lập

---

## FR-M-003

Hệ thống phải lưu lịch sử vi phạm.

---

## FR-M-004

Hệ thống phải hỗ trợ đính kèm minh chứng.

---

# MODULE N - REPORTS

## FR-N-001

Hệ thống phải xuất danh sách dự thi.

---

## FR-N-002

Hệ thống phải xuất danh sách vắng thi.

---

## FR-N-003

Hệ thống phải xuất danh sách vi phạm.

---

## FR-N-004

Hệ thống phải xuất biên bản phòng thi.

---

## FR-N-005

Hệ thống phải xuất báo cáo kết quả theo học phần.

---

## FR-N-006

Hệ thống phải xuất báo cáo kết quả theo kỳ thi.

---

# MODULE O - AUDIT LOG

## FR-O-001

Hệ thống phải ghi nhận lịch sử đăng nhập.

---

## FR-O-002

Hệ thống phải ghi nhận lịch sử bắt đầu thi.

---

## FR-O-003

Hệ thống phải ghi nhận lịch sử nộp bài.

---

## FR-O-004

Hệ thống phải ghi nhận các thay đổi cấu hình.

---

## FR-O-005

Hệ thống phải ghi nhận các vi phạm.

---

# MODULE P - COMPUTER LAB & EXAM SECURITY

## FR-P-001

Hệ thống phải hỗ trợ chức năng kiểm tra thiết bị trước khi làm bài (Pre-exam check) bao gồm độ tương thích của trình duyệt, kiểm tra phát âm thanh thử và kiểm tra độ ổn định kết nối mạng (ping).

> **Cập nhật (bản hiện tại):** Đã **BỎ màn kiểm tra thiết bị trước khi thi** ở giao diện sinh viên (vào thi trực tiếp) — không cần thiết với đề trắc nghiệm và gây thêm bước thừa. Endpoint `POST /exams/:examId/check-device` vẫn còn ở backend (chưa dùng), có thể bật lại sau nếu triển khai phòng lab thực tế.

---

## FR-P-002

Hệ thống phải cho phép gán số máy thi tĩnh của phòng máy cho từng sinh viên (ví dụ: SV001 -> Máy 01) để quản lý sơ đồ phòng thi, đối chiếu thiết bị và hạn chế sinh viên tự ý đổi chỗ ngồi.

---

## FR-P-003

Hệ thống phải bắt buộc chạy ở chế độ toàn màn hình khóa (Fullscreen Lock) hoặc tích hợp Safe Exam Browser (SEB) khi sinh viên đang làm bài thi.

---

## FR-P-004

Hệ thống phải phát hiện và chặn các hành vi gian lận như chuyển tab trình duyệt, mở cửa sổ mới hoặc sử dụng phím tắt chuyển đổi ứng dụng (Alt+Tab, Win/Cmd, v.v.).

---

## FR-P-005

Hệ thống phải tự động cảnh báo âm thanh tại máy sinh viên, gửi log vi phạm bảo mật về Dashboard của cán bộ coi thi theo thời gian thực và tự động khóa bài thi nếu số lần vi phạm vượt ngưỡng quy định.

---

## FR-P-006

Hệ thống phải giới hạn dải IP truy cập thi, chỉ cho phép các máy tính có IP tĩnh nằm trong dải IP được cấu hình của phòng máy Đại học Kiến trúc Đà Nẵng tham gia ca thi.

---

# MODULE Q - EXAM CONFIGURATION

## FR-Q-001

Khảo thí phải cấu hình **trộn thứ tự câu hỏi** (Shuffle Question) cho từng bài thi.

---

## FR-Q-002

Khảo thí phải cấu hình **trộn thứ tự đáp án** (Shuffle Answer) trong mỗi câu hỏi.

---

## FR-Q-003

Khảo thí phải cấu hình **số lần thi tối đa** (Max Attempt) cho từng bài thi; hệ thống chặn khi sinh viên vượt số lần cho phép.

---

## FR-Q-004

Khảo thí phải cấu hình hiển thị/ẩn **kết quả**, **đáp án đúng** và **giải thích** cho từng bài thi (xem thêm FR-L-003, FR-L-004).

---

# MODULE R - USER & ROLE MANAGEMENT

## FR-R-001

Quản trị phải quản lý danh sách người dùng: xem, tạo, cập nhật, **vô hiệu hoá** (không xoá cứng).

---

## FR-R-002

Quản trị phải quản lý **vai trò (Role)** và **quyền (Permission)** của hệ thống.

---

## FR-R-003

Quản trị phải **gán / thu hồi vai trò** cho người dùng (RBAC).

---

## FR-R-004

Hệ thống phải áp dụng phân quyền theo vai trò trên mọi chức năng; người dùng không đủ quyền bị từ chối truy cập.

---

## FR-R-005

Người dùng bị vô hiệu hoá không được phép đăng nhập.

---

# NON FUNCTIONAL REQUIREMENTS

## NFR-001 Performance

Hệ thống phải hỗ trợ tối thiểu 2.000 sinh viên đồng thời.

---

## NFR-002 Availability

Uptime tối thiểu 99.5%.

---

## NFR-003 Security

* HTTPS bắt buộc.
* JWT Authentication.
* RBAC Authorization.
* Giới hạn dải IP phòng máy tĩnh của trường.

---

## NFR-004 Scalability

Hệ thống phải cho phép mở rộng nhiều phòng thi đồng thời.

---

## NFR-005 Compatibility

Hỗ trợ:

* Chrome
* Edge
* Firefox
* Safari

---

## NFR-006 Device Support

Hỗ trợ:

* Windows
* macOS
* Android
* iOS

---

# ACCEPTANCE CRITERIA

> **Acceptance Criteria được quản lý tập trung tại [06-acceptance-criteria.md](06-acceptance-criteria.md)**
> (nguồn chân lý duy nhất — Mục 8.1 CAIRA). Mục AC trước đây nằm trong SRS đã được gỡ bỏ vì trùng
> ID và lệch nghĩa với doc 06. Mọi AC (gồm AC chấm điểm, báo cáo, công bố kết quả…) xem tại đó,
> nhóm theo Epic của [04-epic-catalog.md](04-epic-catalog.md).
