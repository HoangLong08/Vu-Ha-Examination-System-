# 05-user-story.md

# DAU Examination System

# User Story Catalog

Version 1.1

---

# EPIC-01 AUTHENTICATION & SSO

## US-001

Là Sinh viên

Tôi muốn đăng nhập bằng tài khoản trường (SSO)

Để truy cập hệ thống thi mà không cần tạo tài khoản riêng.

### Tiêu chí nghiệm thu

* Đăng nhập qua SSO thành công.
* Hệ thống trả về hồ sơ người dùng.
* Chuyển hướng về Dashboard.

---

## US-002

Là Cán bộ coi thi

Tôi muốn đăng nhập bằng tài khoản trường (SSO)

Để truy cập phòng thi được phân công.

### Tiêu chí nghiệm thu

* Vai trò được phân giải đúng.
* Phòng thi được phân công hiển thị chính xác.

---

## US-003

Là Quản trị viên

Tôi muốn đăng xuất an toàn

Để kết thúc phiên làm việc.

### Tiêu chí nghiệm thu

* Access token bị thu hồi.
* Session bị xóa.

---

## US-004

Là Người dùng

Tôi muốn hệ thống ghi nhớ phiên đăng nhập

Để không phải đăng nhập lại nhiều lần.

---

# EPIC-02 USER & ROLE MANAGEMENT

## US-005

Là Quản trị viên

Tôi muốn xem danh sách tất cả người dùng

Để quản lý tài khoản hệ thống.

---

## US-006

Là Quản trị viên

Tôi muốn gán vai trò cho người dùng

Để phân quyền truy cập chức năng.

---

## US-007

Là Quản trị viên

Tôi muốn vô hiệu hóa tài khoản người dùng

Để khóa quyền truy cập khi cần thiết.

---

## US-008

Là Quản trị viên

Tôi muốn kích hoạt lại tài khoản người dùng

Để khôi phục quyền truy cập.

---

# EPIC-03 STUDENT DASHBOARD

## US-009

Là Sinh viên

Tôi muốn xem thông tin cá nhân

Để xác nhận tài khoản đang sử dụng đúng.

---

## US-010

Là Sinh viên

Tôi muốn xem danh sách bài thi sắp tới

Để chuẩn bị cho kỳ thi.

---

## US-011

Là Sinh viên

Tôi muốn xem phòng thi được phân công

Để biết nơi dự thi.

---

## US-012

Là Sinh viên

Tôi muốn xem số báo danh

Để đối chiếu khi vào phòng thi.

---

## US-013

Là Sinh viên

Tôi muốn xem hướng dẫn thi

Để nắm rõ quy chế trước khi thi.

---

# EPIC-04 EXAM MANAGEMENT

## US-014

Là Cán bộ khảo thí

Tôi muốn tạo kỳ thi mới

Để tổ chức thi cho sinh viên.

---

## US-015

Là Cán bộ khảo thí

Tôi muốn cập nhật thông tin kỳ thi

Để chỉnh sửa khi có thay đổi.

---

## US-016

Là Cán bộ khảo thí

Tôi muốn hủy kỳ thi

Để xử lý trường hợp bất khả kháng.

---

## US-017

Là Cán bộ khảo thí

Tôi muốn công bố kỳ thi

Để sinh viên có thể xem lịch thi.

---

## US-018

Là Cán bộ khảo thí

Tôi muốn lưu trữ kỳ thi đã hoàn thành

Để phục vụ công tác tra cứu sau này.

---

# EPIC-05 EXAM SESSION MANAGEMENT

## US-019

Là Cán bộ khảo thí

Tôi muốn tạo ca thi

Để tổ chức thi theo lịch.

---

## US-020

Là Cán bộ khảo thí

Tôi muốn mở ca thi

Để cho phép sinh viên bắt đầu làm bài.

---

## US-021

Là Cán bộ khảo thí

Tôi muốn đóng ca thi

Để kết thúc phiên thi.

---

## US-022

Là Cán bộ khảo thí

Tôi muốn gia hạn thời gian ca thi

Để xử lý sự cố kỹ thuật.

---

## US-023

Là Cán bộ khảo thí

Tôi muốn tạm dừng ca thi

Để xử lý tình huống khẩn cấp.

---

# EPIC-06 EXAM ROOM MANAGEMENT

## US-024

Là Cán bộ khảo thí

Tôi muốn tạo phòng thi

Để quản lý nơi tổ chức thi.

---

## US-025

Là Cán bộ khảo thí

Tôi muốn chỉnh sửa thông tin phòng thi

Để cập nhật khi có thay đổi.

---

## US-026

Là Cán bộ khảo thí

Tôi muốn thiết lập sức chứa phòng thi

Để hệ thống kiểm tra khi phân phòng.

---

## US-027

Là Cán bộ khảo thí

Tôi muốn vô hiệu hóa phòng thi

Để không sử dụng phòng bị hỏng hoặc bảo trì.

---

# EPIC-07 STUDENT ASSIGNMENT

## US-028

Là Cán bộ khảo thí

Tôi muốn phân công sinh viên vào phòng thi

Để tổ chức chỗ ngồi.

---

## US-029

Là Cán bộ khảo thí

Tôi muốn gán số báo danh cho sinh viên

Để quản lý danh sách dự thi.

---

## US-030

Là Cán bộ khảo thí

Tôi muốn chuyển sinh viên giữa các phòng thi

Để xử lý thay đổi phân phòng.

---

## US-031

Là Cán bộ khảo thí

Tôi muốn nhập danh sách phân phòng từ file

Để tiết kiệm thời gian nhập liệu.

---

# EPIC-08 INVIGILATOR ASSIGNMENT

## US-032

Là Cán bộ khảo thí

Tôi muốn phân công cán bộ coi thi vào phòng

Để đảm bảo mỗi phòng có người giám sát.

---

## US-033

Là Cán bộ khảo thí

Tôi muốn thay thế cán bộ coi thi

Để xử lý khi cán bộ vắng mặt.

---

## US-034

Là Cán bộ khảo thí

Tôi muốn xem lịch coi thi của cán bộ

Để tránh phân công trùng lặp.

---

# EPIC-09 ATTENDANCE MANAGEMENT

## US-035

Là Cán bộ coi thi

Tôi muốn điểm danh sinh viên có mặt

Để xác nhận dự thi.

---

## US-036

Là Cán bộ coi thi

Tôi muốn đánh dấu sinh viên vắng mặt

Để ghi nhận và khóa quyền vào thi.

---

## US-037

Là Cán bộ coi thi

Tôi muốn ghi nhận sinh viên đến muộn

Để xử lý theo quy chế.

---

## US-038

Là Cán bộ coi thi

Tôi muốn ghi nhận thời gian điểm danh

Để lưu hồ sơ chính xác.

---

## US-039

Là Cán bộ coi thi

Tôi muốn xem tổng hợp điểm danh

Để nắm tình trạng phòng thi.

---

# EPIC-10 EXAM PLAYER

## US-040

Là Sinh viên

Tôi muốn bắt đầu bài thi

Để thực hiện làm bài.

---

## US-041

Là Sinh viên

Tôi muốn tự kiểm tra độ tương thích thiết bị, âm thanh và kết nối mạng trước khi thi

Để đảm bảo quá trình thi diễn ra suôn sẻ.

---

## US-042

Là Sinh viên

Tôi muốn điều hướng qua lại giữa các câu hỏi

Để xem lại và thay đổi đáp án.

---

## US-043

Là Sinh viên

Tôi muốn xem danh sách câu chưa trả lời

Để biết câu nào còn bỏ trống.

---

## US-044

Là Sinh viên

Tôi muốn đánh dấu câu hỏi cần xem lại

Để quay lại kiểm tra trước khi nộp.

---

## US-045

Là Sinh viên

Tôi muốn xem thời gian còn lại

Để phân bổ thời gian làm bài hợp lý.

---

## US-046

Là Sinh viên

Tôi muốn xem hướng dẫn thi trong khi làm bài

Để tra cứu quy chế khi cần.

---

# EPIC-11 QUESTION RENDERING

## US-047

Là Sinh viên

Tôi muốn trả lời câu hỏi Single Choice (một đáp án đúng)

Để hoàn thành bài thi.

---

## US-048

Là Sinh viên

Tôi muốn trả lời câu hỏi Multiple Choice (nhiều đáp án đúng)

Để hoàn thành bài thi.

---

## US-049

Là Sinh viên

Tôi muốn trả lời câu hỏi Đúng/Sai (True/False)

Để hoàn thành bài thi.

---

## US-050

Là Sinh viên

Tôi muốn xem hình ảnh trong câu hỏi

Để hiểu rõ nội dung đề bài.

---

## US-051

Là Sinh viên

Tôi muốn xem video trong câu hỏi

Để hiểu rõ nội dung đề bài.

---

## US-052

Là Sinh viên

Tôi muốn nghe âm thanh trong câu hỏi

Để trả lời các câu hỏi nghe (listening).

---

## US-053

Là Sinh viên

Tôi muốn hình ảnh tải nhanh

Để không bị gián đoạn khi làm bài.

---

## US-054

Là Sinh viên

Tôi muốn video phát mượt

Để không bị giật lag khi xem đề.

---

# EPIC-12 ANSWER MANAGEMENT

## US-055

Là Sinh viên

Tôi muốn đáp án được lưu ngay khi tôi chọn

Để không bị mất câu trả lời.

---

## US-056

Là Sinh viên

Tôi muốn thay đổi đáp án trước khi nộp bài

Để sửa câu trả lời sai.

---

## US-057

Là Sinh viên

Tôi muốn xem số câu đã trả lời

Để biết tiến độ làm bài.

---

## US-058

Là Sinh viên

Tôi muốn xem số câu chưa trả lời

Để biết còn bao nhiêu câu cần làm.

---

# EPIC-13 AUTO SAVE & RECOVERY

## US-059

Là Sinh viên

Tôi muốn hệ thống tự động lưu bài làm lên server và IndexedDB trên máy

Để không mất dữ liệu khi xảy ra sự cố.

---

## US-060

Là Sinh viên

Tôi muốn đáp án được khôi phục và đồng bộ sau khi kết nối lại

Để tiếp tục làm bài mà không mất câu trả lời.

---

## US-061

Là Sinh viên

Tôi muốn tiếp tục bài thi bị gián đoạn

Để hoàn thành bài thi sau sự cố mạng hoặc trình duyệt bị đóng.

---

# EPIC-14 EXAM SESSION MONITORING

## US-062

Là Hệ thống

Tôi muốn theo dõi trạng thái kết nối của sinh viên trong ca thi

Để cập nhật realtime cho cán bộ coi thi.

### Tiêu chí nghiệm thu

* Trạng thái Online/Offline được cập nhật qua WebSocket.
* Dashboard hiển thị đúng trạng thái từng sinh viên.

---

## US-063

Là Hệ thống

Tôi muốn theo dõi trạng thái bài thi của sinh viên (Chưa vào, Đang thi, Đã nộp)

Để hiển thị tiến độ phòng thi.

---

## US-064

Là Hệ thống

Tôi muốn phát hiện và cảnh báo khi sinh viên mất kết nối

Để cán bộ coi thi xử lý kịp thời.

---

# EPIC-15 INVIGILATOR DASHBOARD

## US-065

Là Cán bộ coi thi

Tôi muốn xem danh sách sinh viên trong phòng thi

Để theo dõi tình trạng dự thi.

---

## US-066

Là Cán bộ coi thi

Tôi muốn gán vị trí máy thi tĩnh trong phòng máy cho từng sinh viên

Để dễ quản lý sơ đồ và đối chiếu máy.

---

## US-067

Là Cán bộ coi thi

Tôi muốn biết sinh viên nào chưa đăng nhập

Để kiểm tra và nhắc nhở.

---

## US-068

Là Cán bộ coi thi

Tôi muốn biết sinh viên nào đang làm bài

Để theo dõi quá trình thi.

---

## US-069

Là Cán bộ coi thi

Tôi muốn biết sinh viên nào đã nộp bài

Để theo dõi tiến độ.

---

## US-070

Là Cán bộ coi thi

Tôi muốn xem thời gian còn lại của từng sinh viên

Để hỗ trợ giám sát.

---

## US-071

Là Cán bộ coi thi

Tôi muốn xem số lượng sinh viên đang online

Để theo dõi phòng thi.

---

## US-072

Là Cán bộ coi thi

Tôi muốn xem số lượng sinh viên mất kết nối

Để xử lý kịp thời.

---

# EPIC-16 SUBMISSION MANAGEMENT

## US-073

Là Sinh viên

Tôi muốn nộp bài thi thủ công

Để hoàn thành bài thi khi đã làm xong.

### Tiêu chí nghiệm thu

* Hiển thị xác nhận trước khi nộp.
* Hiển thị số câu đã làm và chưa làm.
* Trạng thái chuyển sang Submitted sau khi nộp.

---

## US-074

Là Hệ thống

Tôi muốn tự động nộp bài khi hết thời gian

Để đảm bảo không có bài thi nào quá giờ.

### Tiêu chí nghiệm thu

* Khóa giao diện làm bài khi hết giờ.
* Lưu đáp án cuối cùng và nộp tự động.

---

## US-075

Là Hệ thống

Tôi muốn khóa toàn bộ thao tác chỉnh sửa sau khi nộp bài

Để đảm bảo tính toàn vẹn bài thi.

---

# EPIC-17 GRADING ENGINE

## US-076

Là Hệ thống

Tôi muốn chấm điểm tự động cho câu hỏi Single Choice

Để tính điểm theo đáp án đúng duy nhất.

---

## US-077

Là Hệ thống

Tôi muốn chấm điểm tự động cho câu hỏi Multiple Choice

Để tính điểm theo cấu hình: tuyệt đối (All-or-Nothing) hoặc từng phần (Partial Credit).

---

## US-078

Là Hệ thống

Tôi muốn chấm điểm tự động cho câu hỏi True/False

Để tính điểm theo giá trị đúng/sai.

---

## US-079

Là Hệ thống

Tôi muốn tính tổng điểm, số câu đúng, số câu sai cho mỗi bài thi

Để lưu kết quả vào cơ sở dữ liệu.

---

# EPIC-18 RESULT MANAGEMENT

## US-080

Là Sinh viên

Tôi muốn xem kết quả bài thi

Để biết điểm số của mình.

### Tiêu chí nghiệm thu

Hiển thị:

* Điểm thi
* Số câu đúng
* Số câu sai
* Thời gian làm bài

---

## US-081

Là Sinh viên

Tôi muốn xem lịch sử các lần thi

Để theo dõi kết quả học tập.

---

## US-082

Là Sinh viên

Tôi muốn xem đáp án đúng

Để đối chiếu với bài làm của mình khi được Cán bộ khảo thí cho phép.

---

## US-083

Là Sinh viên

Tôi muốn xem giải thích đáp án

Để hiểu kiến thức bị sai khi bài thi được bật chức năng hiển thị giải thích.

---

## US-084

Là Cán bộ khảo thí

Tôi muốn công bố kết quả thi

Để sinh viên có thể xem điểm.

---

## US-085

Là Cán bộ khảo thí

Tôi muốn ẩn kết quả thi

Để chưa công bố cho sinh viên.

---

# EPIC-19 VIOLATION MANAGEMENT

## US-086

Là Cán bộ coi thi

Tôi muốn lập biên bản vi phạm

Để ghi nhận các trường hợp vi phạm quy chế thi.

---

## US-087

Là Cán bộ coi thi

Tôi muốn chọn loại vi phạm

Để chuẩn hóa dữ liệu vi phạm.

### Ví dụ

* Sử dụng tài liệu
* Sử dụng điện thoại
* Đăng nhập sai tài khoản
* Chuyển tab / Thoát toàn màn hình

---

## US-088

Là Cán bộ coi thi

Tôi muốn nhập mô tả vi phạm và ghi nhận số máy thi tương ứng

Để lưu thông tin chi tiết.

---

## US-089

Là Cán bộ coi thi

Tôi muốn tải lên minh chứng vi phạm

Để phục vụ xử lý sau kỳ thi.

---

## US-090

Là Cán bộ khảo thí

Tôi muốn xem danh sách vi phạm của phòng thi

Để xử lý theo quy định.

---

# EPIC-20 REPORTING & STATISTICS

## US-091

Là Cán bộ khảo thí

Tôi muốn xuất danh sách dự thi

Để phục vụ công tác lưu trữ.

---

## US-092

Là Cán bộ khảo thí

Tôi muốn xuất danh sách vắng thi

Để phục vụ báo cáo.

---

## US-093

Là Cán bộ khảo thí

Tôi muốn xuất danh sách vi phạm

Để phục vụ xử lý kỷ luật.

---

## US-094

Là Cán bộ khảo thí

Tôi muốn xem thống kê điểm theo học phần

Để đánh giá kết quả thi.

---

## US-095

Là Cán bộ khảo thí

Tôi muốn xem thống kê theo lớp học

Để đánh giá chất lượng đào tạo.

---

## US-096

Là Cán bộ khảo thí

Tôi muốn xem tỷ lệ đạt và không đạt

Để phục vụ báo cáo.

---

## US-097

Là Cán bộ khảo thí

Tôi muốn xuất báo cáo tổng hợp kết quả ca thi/phòng thi

Để gửi lãnh đạo.

---

# EPIC-21 API INTEGRATION

## US-098

Là Hệ thống

Tôi muốn đồng bộ sinh viên từ UMS

Để cập nhật dữ liệu mới nhất.

---

## US-099

Là Hệ thống

Tôi muốn đồng bộ lịch thi

Để hiển thị cho sinh viên.

---

## US-100

Là Hệ thống

Tôi muốn lấy đề thi từ Exam Core API

Để phục vụ bài thi.

---

## US-101

Là Hệ thống

Tôi muốn lấy câu hỏi từ API

Để hiển thị trên màn hình thi.

---

## US-102

Là Hệ thống

Tôi muốn gửi kết quả thi về hệ thống nguồn

Để đồng bộ dữ liệu.

---

## US-103

Là Quản trị viên

Tôi muốn cấu hình endpoint API

Để thay đổi môi trường kết nối.

---

# EPIC-22 AUDIT LOGGING

## US-104

Là Quản trị viên

Tôi muốn xem lịch sử đăng nhập

Để kiểm tra hoạt động người dùng.

---

## US-105

Là Quản trị viên

Tôi muốn xem lịch sử bắt đầu thi kèm theo IP Client và User Agent

Để phục vụ kiểm tra khiếu nại và bảo mật phòng máy.

---

## US-106

Là Quản trị viên

Tôi muốn xem lịch sử nộp bài

Để phục vụ kiểm tra kết quả.

---

## US-107

Là Quản trị viên

Tôi muốn xem lịch sử thay đổi cấu hình

Để kiểm soát hệ thống.

---

## US-108

Là Quản trị viên

Tôi muốn tìm kiếm nhật ký hệ thống

Để phục vụ điều tra sự cố.

---

# EPIC-23 SYSTEM CONFIGURATION

## US-109

Là Quản trị viên

Tôi muốn cấu hình kết nối SSO (Client ID, Secret, URLs)

Để hệ thống xác thực qua tài khoản trường.

---

## US-110

Là Quản trị viên

Tôi muốn cấu hình dải IP tĩnh phòng máy được phép thi

Để hạn chế truy cập từ bên ngoài phòng thi.

### Tiêu chí nghiệm thu

* Nhập danh sách dải IP (CIDR).
* Hệ thống chặn máy ngoài dải IP khi làm bài.

---

## US-111

Là Quản trị viên

Tôi muốn cấu hình kết nối UMS API và Exam Core API

Để hệ thống đồng bộ dữ liệu từ nguồn bên ngoài.

---

# EPIC-24 EXAM CONFIGURATION

## US-112

Là Cán bộ khảo thí

Tôi muốn cấu hình hiển thị kết quả cho bài thi (Cho xem điểm / Ẩn điểm)

Để kiểm soát thông tin công bố cho sinh viên.

---

## US-113

Là Cán bộ khảo thí

Tôi muốn cấu hình hiển thị đáp án và giải thích cho bài thi

Để sinh viên xem lại sau khi thi (nếu được phép).

---

## US-114

Là Cán bộ khảo thí

Tôi muốn cấu hình trộn câu hỏi (Shuffle Question) và trộn đáp án (Shuffle Answer)

Để hạn chế sinh viên nhìn bài nhau.

---

## US-115

Là Cán bộ khảo thí

Tôi muốn cấu hình số lần thi tối đa (Max Attempt)

Để kiểm soát quy chế thi lại.

---

# EPIC-25 BROWSER LOCKDOWN & LAB SECURITY

## US-116

Là Hệ thống

Tôi muốn bắt buộc khóa màn hình thi ở chế độ toàn màn hình (Fullscreen Mode) khi sinh viên bắt đầu làm bài

Để ngăn thí sinh sử dụng các ứng dụng khác.

---

## US-117

Là Hệ thống

Tôi muốn tự động phát hiện, cảnh báo và lập log khi sinh viên chuyển tab trình duyệt hoặc mất focus (blur)

Để gửi cảnh báo đỏ tức thời về Dashboard của Cán bộ coi thi.

---

## US-118

Là Hệ thống

Tôi muốn giới hạn IP truy cập làm bài thi chỉ trong dải IP mạng phòng máy thi được cấu hình

Để chặn thí sinh làm bài từ xa hoặc bên ngoài phòng thi.

---

# TỔNG KẾT

Tổng số User Stories: **118**

| Epic | Phạm vi US | Số lượng |
|------|-----------|----------|
| EPIC-01 Authentication & SSO | US-001 → US-004 | 4 |
| EPIC-02 User & Role Management | US-005 → US-008 | 4 |
| EPIC-03 Student Dashboard | US-009 → US-013 | 5 |
| EPIC-04 Exam Management | US-014 → US-018 | 5 |
| EPIC-05 Exam Session Management | US-019 → US-023 | 5 |
| EPIC-06 Exam Room Management | US-024 → US-027 | 4 |
| EPIC-07 Student Assignment | US-028 → US-031 | 4 |
| EPIC-08 Invigilator Assignment | US-032 → US-034 | 3 |
| EPIC-09 Attendance Management | US-035 → US-039 | 5 |
| EPIC-10 Exam Player | US-040 → US-046 | 7 |
| EPIC-11 Question Rendering | US-047 → US-054 | 8 |
| EPIC-12 Answer Management | US-055 → US-058 | 4 |
| EPIC-13 Auto Save & Recovery | US-059 → US-061 | 3 |
| EPIC-14 Exam Session Monitoring | US-062 → US-064 | 3 |
| EPIC-15 Invigilator Dashboard | US-065 → US-072 | 8 |
| EPIC-16 Submission Management | US-073 → US-075 | 3 |
| EPIC-17 Grading Engine | US-076 → US-079 | 4 |
| EPIC-18 Result Management | US-080 → US-085 | 6 |
| EPIC-19 Violation Management | US-086 → US-090 | 5 |
| EPIC-20 Reporting & Statistics | US-091 → US-097 | 7 |
| EPIC-21 API Integration | US-098 → US-103 | 6 |
| EPIC-22 Audit Logging | US-104 → US-108 | 5 |
| EPIC-23 System Configuration | US-109 → US-111 | 3 |
| EPIC-24 Exam Configuration | US-112 → US-115 | 4 |
| EPIC-25 Browser Lockdown & Lab Security | US-116 → US-118 | 3 |

**Tổng: 25 Epic — 118 User Stories**
