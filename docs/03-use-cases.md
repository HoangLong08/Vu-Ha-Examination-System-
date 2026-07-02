# 03-use-cases.md

# USE CASE CATALOG

# DAU EXAMINATION SYSTEM

## Version 1.0

---

# 1. Tổng quan

Tài liệu này mô tả các Use Case chính của Phân hệ Thi Trắc nghiệm Trực tuyến thuộc Hệ thống Khảo thí.

Hệ thống phục vụ 4 nhóm người dùng chính:

1. Sinh viên
2. Cán bộ coi thi
3. Cán bộ khảo thí
4. Quản trị hệ thống

---

# 2. Actor

## ACT-01 Student

Sinh viên tham gia thi.

## ACT-02 Invigilator

Cán bộ coi thi tại phòng máy hoặc giám sát thi online.

## ACT-03 Examination Officer

Cán bộ khảo thí quản lý kỳ thi, ca thi, phòng thi và kết quả.

## ACT-04 Administrator

Quản trị viên hệ thống.

## ACT-05 External System

Các hệ thống bên ngoài gồm:

* SSO
* UMS
* Exam Core API

---

# 3. Use Case của Sinh viên

## UC-001 Đăng nhập SSO

### Actor

Student

### Mục tiêu

Sinh viên đăng nhập hệ thống bằng tài khoản trường.

### Tiền điều kiện

Sinh viên có tài khoản hợp lệ trên hệ thống SSO.

### Luồng chính

1. Sinh viên truy cập hệ thống.
2. Sinh viên chọn đăng nhập.
3. Hệ thống chuyển đến SSO.
4. Sinh viên nhập tài khoản.
5. SSO xác thực thành công.
6. Hệ thống nhận thông tin sinh viên.
7. Hệ thống chuyển sinh viên vào Dashboard.

### Ngoại lệ

* Tài khoản sai.
* Tài khoản bị khóa.
* Không lấy được thông tin từ SSO.

### Kết quả

Sinh viên đăng nhập thành công.

---

## UC-002 Xem thông tin cá nhân

### Actor

Student

### Mục tiêu

Sinh viên kiểm tra thông tin cá nhân trước khi thi.

### Luồng chính

1. Sinh viên đăng nhập.
2. Hệ thống hiển thị:

   * Mã sinh viên
   * Họ tên
   * Lớp
   * Email
3. Sinh viên xác nhận thông tin.

### Kết quả

Sinh viên biết đúng tài khoản đang sử dụng.

---

## UC-003 Xem lịch thi

### Actor

Student

### Mục tiêu

Sinh viên xem các bài thi được phân công.

### Luồng chính

1. Sinh viên vào Dashboard.
2. Hệ thống gọi API lấy lịch thi.
3. Hệ thống hiển thị danh sách bài thi.
4. Sinh viên xem thông tin từng bài thi.

### Thông tin hiển thị

* Học phần
* Ngày thi
* Giờ thi
* Ca thi
* Phòng thi
* Số báo danh
* Trạng thái

### Kết quả

Sinh viên biết lịch thi của mình.

---

## UC-004 Xem chi tiết bài thi

### Actor

Student

### Mục tiêu

Sinh viên xem thông tin chi tiết trước khi vào thi.

### Luồng chính

1. Sinh viên chọn bài thi.
2. Hệ thống hiển thị:

   * Tên học phần
   * Thời gian làm bài
   * Số câu hỏi
   * Quy định thi
   * Trạng thái bài thi
3. Sinh viên đọc thông tin.

### Kết quả

Sinh viên nắm được thông tin bài thi.

---

## UC-005 Kiểm tra thiết bị trước khi thi

> **Đã BỎ ở bản hiện tại** — sinh viên vào thi trực tiếp, không qua màn kiểm tra
> thiết bị (xem FR-P-001). Use case giữ lại để tham chiếu, có thể bật lại sau.

### Actor

Student

### Mục tiêu

Sinh viên kiểm tra độ tương thích và sẵn sàng của thiết bị trước khi bắt đầu làm bài.

### Luồng chính

1. Sinh viên truy cập vào phòng thi chờ.
2. Hệ thống tự động kiểm tra phiên bản trình duyệt có được hỗ trợ hay không.
3. Hệ thống hiển thị công cụ kiểm tra âm thanh (phát audio test).
4. Sinh viên xác nhận nghe rõ âm thanh hoặc báo cáo sự cố cho cán bộ coi thi.
5. Hệ thống đo đạc tốc độ ping và độ ổn định của kết nối mạng.
6. Hệ thống hiển thị trạng thái "Thiết bị sẵn sàng" nếu tất cả các kiểm tra đều đạt.

### Ngoại lệ

* Trình duyệt không được hỗ trợ (cảnh báo yêu cầu cập nhật hoặc đổi trình duyệt).
* Không nghe được âm thanh thử.
* Kết nối mạng yếu hoặc gián đoạn.

### Kết quả

Sinh viên đảm bảo thiết bị hoạt động tốt trước khi thi.

---

## UC-006 Bắt đầu thi

### Actor

Student

### Mục tiêu

Sinh viên bắt đầu phiên làm bài.

### Tiền điều kiện

* Sinh viên đã đăng nhập.
* Sinh viên có tên trong danh sách thi.
* Ca thi đã mở.
* Sinh viên không bị đánh dấu vắng mặt.

### Luồng chính

1. Sinh viên nhấn “Bắt đầu thi”.
2. Hệ thống kiểm tra quyền vào thi.
3. Hệ thống khởi tạo Exam Attempt.
4. Hệ thống lấy đề thi từ API.
5. Hệ thống hiển thị màn hình làm bài.
6. Bộ đếm thời gian bắt đầu chạy.

### Ngoại lệ

* Chưa đến giờ thi.
* Ca thi đã đóng.
* Sinh viên không thuộc danh sách thi.
* Không lấy được đề thi.

### Kết quả

Phiên thi của sinh viên được khởi tạo.

---

## UC-007 Làm bài thi Single Choice

### Actor

Student

### Mục tiêu

Sinh viên trả lời câu hỏi một đáp án đúng.

### Luồng chính

1. Hệ thống hiển thị câu hỏi.
2. Sinh viên chọn một đáp án.
3. Hệ thống lưu đáp án.
4. Sinh viên có thể đổi đáp án trước khi nộp bài.

### Kết quả

Đáp án được lưu.

---

## UC-008 Làm bài thi Multiple Choice

### Actor

Student

### Mục tiêu

Sinh viên trả lời câu hỏi nhiều đáp án đúng.

### Luồng chính

1. Hệ thống hiển thị câu hỏi.
2. Sinh viên chọn một hoặc nhiều đáp án.
3. Hệ thống lưu danh sách đáp án.
4. Sinh viên có thể thay đổi trước khi nộp bài.

### Kết quả

Các đáp án được lưu.

---

## UC-009 Làm bài thi True/False

### Actor

Student

### Mục tiêu

Sinh viên trả lời câu hỏi đúng/sai.

### Luồng chính

1. Hệ thống hiển thị câu hỏi.
2. Sinh viên chọn Đúng hoặc Sai.
3. Hệ thống lưu đáp án.

### Kết quả

Đáp án được lưu.

---

## UC-010 Xem câu hỏi có hình ảnh

### Actor

Student

### Mục tiêu

Sinh viên xem câu hỏi có hình ảnh minh họa.

### Luồng chính

1. Hệ thống tải câu hỏi.
2. Hệ thống hiển thị hình ảnh kèm nội dung.
3. Sinh viên xem hình ảnh và trả lời.

### Kết quả

Câu hỏi có hình ảnh hiển thị đúng.

---

## UC-011 Xem câu hỏi có video

### Actor

Student

### Mục tiêu

Sinh viên xem video phục vụ câu hỏi.

### Luồng chính

1. Hệ thống hiển thị video.
2. Sinh viên phát video.
3. Sinh viên trả lời câu hỏi.

### Kết quả

Video phát được trong màn hình thi.

---

## UC-012 Nghe câu hỏi âm thanh

### Actor

Student

### Mục tiêu

Sinh viên nghe audio, đặc biệt trong bài thi tiếng Anh.

### Luồng chính

1. Hệ thống hiển thị audio player.
2. Sinh viên bấm phát âm thanh.
3. Sinh viên nghe và trả lời câu hỏi.

### Ngoại lệ

* File âm thanh lỗi.
* Trình duyệt không hỗ trợ phát.

### Kết quả

Âm thanh phát được.

---

## UC-013 Điều hướng câu hỏi

### Actor

Student

### Mục tiêu

Sinh viên chuyển qua lại giữa các câu hỏi.

### Luồng chính

1. Sinh viên chọn số câu hỏi.
2. Hệ thống chuyển đến câu tương ứng.
3. Hệ thống giữ nguyên các đáp án đã chọn.

### Kết quả

Sinh viên điều hướng được toàn bộ bài thi.

---

## UC-014 Đánh dấu câu hỏi cần xem lại

### Actor

Student

### Mục tiêu

Sinh viên đánh dấu câu hỏi chưa chắc chắn.

### Luồng chính

1. Sinh viên bấm “Đánh dấu”.
2. Hệ thống ghi nhận trạng thái.
3. Câu hỏi được hiển thị khác biệt trong danh sách câu.

### Kết quả

Sinh viên dễ quay lại câu hỏi cần xem lại.

---

## UC-015 Theo dõi thời gian còn lại

### Actor

Student

### Mục tiêu

Sinh viên biết thời gian làm bài còn lại.

### Luồng chính

1. Hệ thống hiển thị đồng hồ đếm ngược.
2. Hệ thống cập nhật liên tục.
3. Khi gần hết giờ, hệ thống cảnh báo.

### Kết quả

Sinh viên biết thời gian còn lại.

---

## UC-016 Tự động lưu bài làm

### Actor

Student, System

### Mục tiêu

Không mất dữ liệu bài làm khi xảy ra sự cố.

### Luồng chính

1. Sinh viên chọn đáp án.
2. Hệ thống lưu ngay đáp án.
3. Định kỳ hệ thống tự lưu toàn bộ trạng thái bài thi.
4. Hệ thống ghi nhận thời điểm lưu gần nhất.

### Kết quả

Bài làm được lưu an toàn.

---

## UC-017 Khôi phục bài thi

### Actor

Student

### Mục tiêu

Sinh viên tiếp tục bài thi sau khi mất mạng, tắt trình duyệt hoặc đăng nhập lại.

### Tiền điều kiện

Sinh viên có Exam Attempt đang mở.

### Luồng chính

1. Sinh viên đăng nhập lại.
2. Hệ thống phát hiện bài thi chưa nộp.
3. Hệ thống khôi phục:

   * Câu đã trả lời
   * Câu đã đánh dấu
   * Thời gian còn lại
4. Sinh viên tiếp tục làm bài.

### Kết quả

Sinh viên tiếp tục thi mà không mất dữ liệu.

---

## UC-018 Nộp bài thủ công

### Actor

Student

### Mục tiêu

Sinh viên chủ động nộp bài.

### Luồng chính

1. Sinh viên bấm “Nộp bài”.
2. Hệ thống hiển thị xác nhận.
3. Hệ thống hiển thị số câu chưa làm.
4. Sinh viên xác nhận.
5. Hệ thống khóa bài thi.
6. Hệ thống chuyển trạng thái Submitted.

### Kết quả

Bài thi được nộp thành công.

---

## UC-019 Tự động nộp bài khi hết giờ

### Actor

System

### Mục tiêu

Hệ thống tự nộp bài khi hết thời gian.

### Luồng chính

1. Đồng hồ về 0.
2. Hệ thống khóa giao diện làm bài.
3. Hệ thống lưu đáp án cuối cùng.
4. Hệ thống nộp bài.
5. Hệ thống chuyển trạng thái Submitted.

### Kết quả

Bài thi được nộp tự động.

---

## UC-020 Xem kết quả thi

### Actor

Student

### Mục tiêu

Sinh viên xem điểm thi sau khi được công bố.

### Tiền điều kiện

Kết quả đã được công bố.

### Luồng chính

1. Sinh viên vào mục Kết quả.
2. Hệ thống hiển thị danh sách bài thi đã hoàn thành.
3. Sinh viên chọn bài thi.
4. Hệ thống hiển thị điểm.

### Kết quả

Sinh viên xem được kết quả.

---

## UC-021 Xem lịch sử thi

### Actor

Student

### Mục tiêu

Sinh viên xem lại các lần thi trước.

### Luồng chính

1. Sinh viên vào Lịch sử thi.
2. Hệ thống hiển thị:

   * Tên bài thi
   * Ngày thi
   * Điểm số
   * Trạng thái
3. Sinh viên chọn chi tiết nếu được phép.

### Kết quả

Sinh viên xem được lịch sử thi.

---

# 4. Use Case của Cán bộ coi thi

## UC-022 Đăng nhập hệ thống

### Actor

Invigilator

### Mục tiêu

Cán bộ coi thi đăng nhập để quản lý phòng thi.

### Luồng chính

1. Cán bộ coi thi đăng nhập SSO.
2. Hệ thống xác thực vai trò.
3. Hệ thống hiển thị danh sách phòng được phân công.

### Kết quả

Cán bộ coi thi truy cập được Dashboard.

---

## UC-023 Xem danh sách phòng thi được phân công

### Actor

Invigilator

### Mục tiêu

Cán bộ coi thi xem các phòng thi mình phụ trách.

### Luồng chính

1. Cán bộ coi thi vào Dashboard.
2. Hệ thống hiển thị danh sách phòng.
3. Cán bộ chọn phòng cần coi thi.

### Kết quả

Cán bộ truy cập được phòng thi.

---

## UC-024 Xem danh sách sinh viên trong phòng

### Actor

Invigilator

### Mục tiêu

Cán bộ coi thi kiểm tra danh sách sinh viên.

### Luồng chính

1. Cán bộ chọn phòng thi.
2. Hệ thống hiển thị danh sách sinh viên.
3. Danh sách gồm:

   * Mã sinh viên
   * Họ tên
   * Số báo danh
   * Trạng thái điểm danh
   * Trạng thái thi

### Kết quả

Cán bộ coi thi xem được danh sách sinh viên.

---

## UC-025 Điểm danh sinh viên

### Actor

Invigilator

### Mục tiêu

Cán bộ coi thi xác nhận sinh viên có mặt.

### Luồng chính

1. Cán bộ chọn sinh viên.
2. Cán bộ đánh dấu “Có mặt”.
3. Hệ thống lưu thời gian điểm danh.
4. Hệ thống lưu người điểm danh.

### Kết quả

Sinh viên được xác nhận có mặt.

---

## UC-026 Gán số máy thi cho sinh viên

### Actor

Invigilator

### Mục tiêu

Gán vị trí máy thi thực tế của sinh viên trong phòng máy để phục vụ kiểm soát vị trí và chống gian lận.

### Luồng chính

1. Cán bộ coi thi truy cập Dashboard phòng thi.
2. Cán bộ coi thi chọn tài khoản sinh viên cần gán.
3. Nhập số máy tương ứng (ví dụ: SV001 -> Máy 01, SV002 -> Máy 02).
4. Hệ thống cập nhật sơ đồ vị trí phòng thi.
5. Cán bộ coi thi có thể nhập danh sách hàng loạt từ file Excel phân máy.

### Kết quả

Số máy thi được liên kết chính xác với sinh viên trong ca thi.

---

## UC-027 Đánh dấu vắng mặt

### Actor

Invigilator

### Mục tiêu

Cán bộ coi thi ghi nhận sinh viên vắng thi.

### Luồng chính

1. Cán bộ chọn sinh viên.
2. Cán bộ đánh dấu “Vắng mặt”.
3. Hệ thống lưu trạng thái.
4. Hệ thống khóa quyền vào thi của sinh viên đó.

### Kết quả

Sinh viên bị ghi nhận vắng thi.

---

## UC-028 Ghi nhận sinh viên đến muộn

### Actor

Invigilator

### Mục tiêu

Cán bộ coi thi ghi nhận sinh viên vào thi muộn.

### Luồng chính

1. Cán bộ chọn sinh viên.
2. Cán bộ đánh dấu “Đến muộn”.
3. Hệ thống ghi nhận thời điểm.
4. Sinh viên được phép hoặc không được phép thi theo cấu hình.

### Kết quả

Trạng thái đến muộn được lưu.

---

## UC-029 Theo dõi trạng thái sinh viên

### Actor

Invigilator

### Mục tiêu

Cán bộ coi thi biết sinh viên đã vào hệ thống hay chưa.

### Luồng chính

1. Cán bộ mở Dashboard phòng thi.
2. Hệ thống cập nhật trạng thái sinh viên.
3. Trạng thái gồm:

   * Chưa đăng nhập
   * Đã đăng nhập
   * Đang thi
   * Mất kết nối
   * Đã nộp bài

### Kết quả

Cán bộ coi thi giám sát được phòng thi.

---

## UC-030 Theo dõi tiến độ phòng thi

### Actor

Invigilator

### Mục tiêu

Cán bộ coi thi xem tổng quan tiến độ phòng thi.

### Luồng chính

1. Hệ thống hiển thị số lượng:

   * Tổng sinh viên
   * Đã điểm danh
   * Chưa đăng nhập
   * Đang thi
   * Đã nộp
   * Mất kết nối
2. Cán bộ theo dõi trong thời gian thực.

### Kết quả

Cán bộ nắm được tình hình phòng thi.

---

## UC-031 Xem cảnh báo mất kết nối

### Actor

Invigilator

### Mục tiêu

Cán bộ coi thi phát hiện sinh viên bị mất kết nối.

### Luồng chính

1. Hệ thống phát hiện sinh viên mất kết nối.
2. Dashboard hiển thị cảnh báo.
3. Cán bộ kiểm tra tình trạng máy tính hoặc mạng.
4. Hệ thống ghi log sự kiện.

### Kết quả

Sự cố mất kết nối được phát hiện.

---

## UC-032 Ghi nhận vi phạm

### Actor

Invigilator

### Mục tiêu

Cán bộ coi thi lập ghi nhận vi phạm trong ca thi.

### Luồng chính

1. Cán bộ chọn sinh viên.
2. Cán bộ chọn “Ghi nhận vi phạm”.
3. Cán bộ nhập:

   * Loại vi phạm
   * Mô tả
   * Thời gian
4. Hệ thống lưu vi phạm.

### Kết quả

Vi phạm được ghi nhận.

---

## UC-033 Đính kèm minh chứng vi phạm

### Actor

Invigilator

### Mục tiêu

Cán bộ coi thi thêm minh chứng cho vi phạm.

### Luồng chính

1. Cán bộ mở bản ghi vi phạm.
2. Cán bộ tải lên file minh chứng.
3. Hệ thống lưu file.
4. Hệ thống liên kết file với vi phạm.

### Kết quả

Minh chứng được lưu.

---

## UC-034 Xuất danh sách dự thi

### Actor

Invigilator

### Mục tiêu

Cán bộ coi thi xuất danh sách sinh viên dự thi.

### Luồng chính

1. Cán bộ chọn phòng thi.
2. Cán bộ chọn xuất danh sách.
3. Hệ thống tạo file.
4. Cán bộ tải file.

### Kết quả

Danh sách dự thi được xuất.

---

## UC-035 Xuất biên bản phòng thi

### Actor

Invigilator

### Mục tiêu

Cán bộ coi thi xuất biên bản sau ca thi.

### Luồng chính

1. Cán bộ chọn phòng thi.
2. Hệ thống tổng hợp:

   * Danh sách dự thi
   * Danh sách vắng
   * Danh sách vi phạm
   * Thời gian bắt đầu/kết thúc
3. Cán bộ xuất biên bản.

### Kết quả

Biên bản phòng thi được tạo.

---

# 5. Use Case của Cán bộ khảo thí

## UC-036 Tạo kỳ thi

### Actor

Examination Officer

### Mục tiêu

Cán bộ khảo thí tạo kỳ thi mới.

### Luồng chính

1. Cán bộ vào Quản lý kỳ thi.
2. Chọn tạo kỳ thi.
3. Nhập:

   * Tên kỳ thi
   * Học kỳ
   * Năm học
   * Mô tả
4. Lưu kỳ thi.

### Kết quả

Kỳ thi được tạo.

---

## UC-037 Tạo đợt thi

### Actor

Examination Officer

### Mục tiêu

Tạo đợt thi thuộc kỳ thi.

### Luồng chính

1. Cán bộ chọn kỳ thi.
2. Tạo đợt thi.
3. Nhập thời gian bắt đầu/kết thúc.
4. Lưu đợt thi.

### Kết quả

Đợt thi được tạo.

---

## UC-038 Tạo ca thi

### Actor

Examination Officer

### Mục tiêu

Tạo ca thi trong đợt thi.

### Luồng chính

1. Cán bộ chọn đợt thi.
2. Tạo ca thi.
3. Nhập:

   * Ngày thi
   * Giờ bắt đầu
   * Giờ kết thúc
   * Thời lượng bài thi
4. Lưu ca thi.

### Kết quả

Ca thi được tạo.

---

## UC-039 Cấu hình bài thi

### Actor

Examination Officer

### Mục tiêu

Cấu hình quy định cho bài thi.

### Luồng chính

1. Cán bộ chọn bài thi.
2. Cấu hình:

   * Thời gian làm bài
   * Số lần thi
   * Cho xem điểm hay không
   * Cho xem đáp án hay không
   * Shuffle câu hỏi
   * Shuffle đáp án
3. Lưu cấu hình.

### Kết quả

Bài thi được cấu hình.

---

## UC-040 Phân phòng thi

### Actor

Examination Officer

### Mục tiêu

Phân sinh viên vào phòng thi.

### Luồng chính

1. Cán bộ chọn ca thi.
2. Chọn danh sách sinh viên.
3. Chọn phòng thi.
4. Hệ thống kiểm tra sức chứa.
5. Lưu phân phòng.

### Kết quả

Sinh viên được phân vào phòng thi.

---

## UC-041 Phân công cán bộ coi thi

### Actor

Examination Officer

### Mục tiêu

Gán cán bộ coi thi vào phòng thi.

### Luồng chính

1. Cán bộ chọn phòng thi.
2. Chọn cán bộ coi thi.
3. Lưu phân công.

### Kết quả

Cán bộ coi thi được phân công.

---

## UC-042 Mở ca thi

### Actor

Examination Officer

### Mục tiêu

Cho phép sinh viên bắt đầu thi.

### Luồng chính

1. Cán bộ chọn ca thi.
2. Chọn “Mở ca thi”.
3. Hệ thống kiểm tra cấu hình.
4. Hệ thống chuyển trạng thái ca thi sang Open.

### Kết quả

Sinh viên được phép vào thi.

---

## UC-043 Đóng ca thi

### Actor

Examination Officer

### Mục tiêu

Kết thúc ca thi.

### Luồng chính

1. Cán bộ chọn ca thi.
2. Chọn “Đóng ca thi”.
3. Hệ thống kiểm tra các bài thi chưa nộp.
4. Hệ thống xử lý tự động nộp nếu cần.
5. Ca thi chuyển sang Closed.

### Kết quả

Ca thi kết thúc.

---

## UC-044 Gia hạn thời gian thi

### Actor

Examination Officer

### Mục tiêu

Gia hạn thời gian cho ca thi hoặc sinh viên gặp sự cố.

### Luồng chính

1. Cán bộ chọn ca thi hoặc sinh viên.
2. Nhập thời gian gia hạn.
3. Nhập lý do.
4. Hệ thống cập nhật thời gian.
5. Hệ thống ghi audit log.

### Kết quả

Thời gian thi được gia hạn.

---

## UC-045 Cho phép thi lại

### Actor

Examination Officer

### Mục tiêu

Cho phép sinh viên thi lại khi có sự cố hợp lệ.

### Luồng chính

1. Cán bộ chọn sinh viên.
2. Chọn bài thi.
3. Nhập lý do.
4. Hệ thống tạo attempt mới hoặc reset attempt theo cấu hình.
5. Hệ thống ghi log.

### Kết quả

Sinh viên được phép thi lại.

---

## UC-046 Công bố kết quả

### Actor

Examination Officer

### Mục tiêu

Công bố điểm thi cho sinh viên.

### Luồng chính

1. Cán bộ chọn kỳ thi.
2. Kiểm tra danh sách kết quả.
3. Chọn “Công bố”.
4. Hệ thống chuyển trạng thái Published.

### Kết quả

Sinh viên xem được kết quả.

---

## UC-047 Ẩn kết quả

### Actor

Examination Officer

### Mục tiêu

Tạm ẩn kết quả thi.

### Luồng chính

1. Cán bộ chọn kỳ thi.
2. Chọn “Ẩn kết quả”.
3. Hệ thống chuyển trạng thái Hidden.

### Kết quả

Sinh viên không xem được kết quả.

---

## UC-048 Xem thống kê kết quả

### Actor

Examination Officer

### Mục tiêu

Theo dõi kết quả thi theo kỳ thi, học phần, ca thi.

### Luồng chính

1. Cán bộ mở thống kê.
2. Chọn bộ lọc.
3. Hệ thống hiển thị:

   * Số sinh viên dự thi
   * Số sinh viên vắng
   * Điểm trung bình
   * Tỷ lệ đạt
   * Số bài đã nộp

### Kết quả

Cán bộ khảo thí xem được thống kê.

---

## UC-049 Xuất báo cáo kỳ thi

### Actor

Examination Officer

### Mục tiêu

Xuất báo cáo tổng hợp kỳ thi.

### Luồng chính

1. Cán bộ chọn kỳ thi.
2. Chọn xuất báo cáo.
3. Hệ thống tạo file.
4. Cán bộ tải file.

### Kết quả

Báo cáo kỳ thi được xuất.

---

# 6. Use Case của Quản trị hệ thống

## UC-050 Quản lý người dùng

### Actor

Administrator

### Mục tiêu

Quản trị viên quản lý tài khoản nội bộ.

### Luồng chính

1. Admin vào Quản lý người dùng.
2. Xem danh sách người dùng.
3. Tạo, sửa, khóa hoặc mở khóa tài khoản nội bộ nếu cần.

### Kết quả

Người dùng được quản lý.

---

## UC-051 Quản lý vai trò

### Actor

Administrator

### Mục tiêu

Quản trị viên quản lý vai trò hệ thống.

### Luồng chính

1. Admin vào Quản lý vai trò.
2. Tạo hoặc chỉnh sửa vai trò.
3. Gán quyền cho vai trò.
4. Lưu thay đổi.

### Kết quả

Vai trò được cấu hình.

---

## UC-052 Quản lý phân quyền

### Actor

Administrator

### Mục tiêu

Cấu hình quyền truy cập chức năng.

### Luồng chính

1. Admin chọn vai trò.
2. Chọn danh sách quyền.
3. Lưu phân quyền.

### Kết quả

RBAC được cập nhật.

---

## UC-053 Cấu hình SSO

### Actor

Administrator

### Mục tiêu

Cấu hình kết nối SSO.

### Luồng chính

1. Admin vào Cấu hình tích hợp.
2. Nhập thông tin:

   * Client ID
   * Client Secret
   * Authorization URL
   * Token URL
   * Callback URL
3. Kiểm tra kết nối.
4. Lưu cấu hình.

### Kết quả

SSO hoạt động.

---

## UC-054 Cấu hình UMS API

### Actor

Administrator

### Mục tiêu

Cấu hình kết nối API với UMS.

### Luồng chính

1. Admin nhập endpoint UMS.
2. Nhập API key hoặc thông tin xác thực.
3. Kiểm tra kết nối.
4. Lưu cấu hình.

### Kết quả

Hệ thống kết nối được UMS.

---

## UC-055 Cấu hình Exam Core API

### Actor

Administrator

### Mục tiêu

Cấu hình API lấy đề thi và câu hỏi.

### Luồng chính

1. Admin nhập endpoint Exam Core.
2. Nhập thông tin xác thực.
3. Kiểm tra lấy thử dữ liệu đề thi.
4. Lưu cấu hình.

### Kết quả

Hệ thống lấy được dữ liệu bài thi.

---

## UC-056 Xem Audit Log

### Actor

Administrator

### Mục tiêu

Theo dõi lịch sử thao tác hệ thống.

### Luồng chính

1. Admin vào Audit Log.
2. Chọn bộ lọc:

   * Người dùng
   * Hành động
   * Thời gian
3. Hệ thống hiển thị log.

### Kết quả

Admin xem được lịch sử hệ thống.

---

## UC-057 Theo dõi trạng thái hệ thống

### Actor

Administrator

### Mục tiêu

Theo dõi tình trạng vận hành.

### Luồng chính

1. Admin mở System Monitoring.
2. Hệ thống hiển thị:

   * Số người online
   * Số phiên thi đang chạy
   * Trạng thái API
   * Lỗi hệ thống gần nhất

### Kết quả

Admin giám sát được hệ thống.

---

# 7. Use Case tích hợp hệ thống

## UC-058 Đồng bộ thông tin sinh viên

### Actor

External System, System

### Mục tiêu

Lấy thông tin sinh viên từ UMS.

### Luồng chính

1. Hệ thống gọi UMS API.
2. UMS trả về danh sách sinh viên.
3. Hệ thống cập nhật dữ liệu local cache.
4. Hệ thống ghi log đồng bộ.

### Kết quả

Dữ liệu sinh viên được cập nhật.

---

## UC-059 Đồng bộ lịch thi

### Actor

External System, System

### Mục tiêu

Lấy lịch thi từ hệ thống nguồn.

### Luồng chính

1. Hệ thống gọi API lịch thi.
2. API trả danh sách kỳ thi, ca thi, phòng thi.
3. Hệ thống cập nhật dữ liệu.
4. Sinh viên xem được lịch thi.

### Kết quả

Lịch thi được đồng bộ.

---

## UC-060 Lấy đề thi từ API

### Actor

System, Exam Core API

### Mục tiêu

Lấy dữ liệu đề thi khi sinh viên bắt đầu thi.

### Luồng chính

1. Sinh viên bắt đầu thi.
2. Hệ thống gọi Exam Core API.
3. API trả về:

   * Danh sách câu hỏi
   * Đáp án
   * Cấu hình chấm điểm
   * Media URL
4. Hệ thống lưu snapshot đề thi cho attempt.
5. Hệ thống hiển thị bài thi.

### Kết quả

Đề thi được tải thành công.

---

## UC-061 Gửi kết quả về hệ thống nguồn

### Actor

System, External System

### Mục tiêu

Đẩy kết quả thi về hệ thống khảo thí hoặc UMS.

### Luồng chính

1. Sinh viên nộp bài.
2. Hệ thống chấm điểm.
3. Hệ thống tạo kết quả.
4. Hệ thống gọi API gửi kết quả.
5. Hệ thống nguồn xác nhận nhận dữ liệu.

### Kết quả

Kết quả được đồng bộ về hệ thống nguồn.

---

# 8. Use Case ngoại lệ, sự cố và bảo mật phòng thi

## UC-062 Xử lý mất kết nối trong khi thi

### Actor

Student, System, Invigilator

### Mục tiêu

Đảm bảo sinh viên không mất bài khi mất kết nối.

### Luồng chính

1. Hệ thống phát hiện mất kết nối.
2. Giao diện sinh viên hiển thị cảnh báo.
3. Hệ thống lưu tạm dữ liệu local nếu cần.
4. Dashboard cán bộ coi thi hiển thị Disconnected.
5. Khi có mạng lại, hệ thống đồng bộ dữ liệu.
6. Sinh viên tiếp tục làm bài.

### Kết quả

Bài làm được bảo toàn.

---

## UC-063 Xử lý trình duyệt bị đóng

### Actor

Student, System

### Mục tiêu

Cho phép sinh viên tiếp tục bài thi sau khi mở lại trình duyệt.

### Luồng chính

1. Sinh viên mở lại hệ thống.
2. Đăng nhập lại.
3. Hệ thống phát hiện attempt chưa nộp.
4. Hệ thống khôi phục trạng thái bài thi.
5. Sinh viên tiếp tục thi.

### Kết quả

Bài thi được khôi phục.

---

## UC-064 Xử lý không lấy được đề thi

### Actor

Student, System, Administrator

### Mục tiêu

Xử lý lỗi khi Exam Core API không trả đề.

### Luồng chính

1. Sinh viên bấm bắt đầu thi.
2. Hệ thống gọi API đề thi.
3. API lỗi hoặc timeout.
4. Hệ thống hiển thị thông báo lỗi.
5. Hệ thống ghi log.
6. Sinh viên có thể thử lại nếu ca thi còn mở.

### Kết quả

Lỗi được ghi nhận, không tạo bài thi sai.

---

## UC-065 Xử lý hết giờ nhưng chưa đồng bộ được bài

### Actor

System

### Mục tiêu

Đảm bảo bài thi vẫn được nộp khi hết giờ.

### Luồng chính

1. Thời gian làm bài kết thúc.
2. Hệ thống khóa giao diện.
3. Hệ thống lưu bản cuối cùng.
4. Nếu server chưa phản hồi, hệ thống retry submit.
5. Khi thành công, trạng thái chuyển Submitted.

### Kết quả

Bài thi được nộp an toàn.

---

## UC-066 Khóa máy thi và chế độ thi bảo mật

### Actor

System, Student, Invigilator

### Mục tiêu

Khóa máy tính thi, giới hạn trình duyệt chỉ được hiển thị và tương tác trên trang thi.

### Luồng chính

1. Sinh viên nhấn "Bắt đầu thi".
2. Hệ thống yêu cầu trình duyệt chuyển sang chế độ toàn màn hình (Fullscreen Lock) hoặc chạy thông qua trình duyệt bảo mật (như Safe Exam Browser).
3. Hệ thống khóa các nút bấm điều hướng hệ thống (nút Back, Forward, Reload).
4. Máy thi hiển thị duy nhất nội dung bài thi.

### Ngoại lệ
* Sinh viên cố tình thoát chế độ toàn màn hình (hệ thống lập tức khóa bài thi và cảnh báo).

### Kết quả
Thiết bị thi bị giới hạn truy cập, đảm bảo sinh viên chỉ tương tác với màn hình thi.

---

## UC-067 Chặn chuyển tab và ứng dụng

### Actor

System, Invigilator

### Mục tiêu

Chặn sinh viên mở tab mới, tra cứu tài liệu hoặc sử dụng ứng dụng bên thứ ba để gian lận.

### Luồng chính

1. Trong quá trình làm bài, sinh viên cố gắng chuyển tab hoặc mở ứng dụng khác.
2. Hệ thống phát hiện sự kiện mất tiêu điểm (blur event) của trình duyệt.
3. Hệ thống chặn các phím tắt hệ thống (Alt+Tab, Windows Key, Cmd+Tab).
4. Hệ thống phát âm thanh cảnh báo sinh viên và gửi cảnh báo đỏ về Dashboard của cán bộ coi thi.
5. Nếu số lần chuyển tab vượt quá cấu hình cho phép, hệ thống tự động khóa bài thi.

### Kết quả
Hệ thống ngăn chặn và ghi nhận hành vi chuyển tab/ứng dụng.

---

# 9. Tổng kết Use Case

Tổng số Use Case trong phiên bản này: 67

Nhóm Use Case:

* Student: UC-001 đến UC-021
* Invigilator: UC-022 đến UC-035
* Examination Officer: UC-036 đến UC-049
* Administrator: UC-050 đến UC-057
* Integration: UC-058 đến UC-061 (058: Đồng bộ SV, 059: Đồng bộ lịch thi, 060: Lấy đề thi, 061: Gửi kết quả)
* Exception Handling & Security: UC-062 đến UC-067

Tài liệu này là cơ sở để xây dựng:

* Epic Catalog
* User Story Catalog
* Sprint Plan
* ERD
* API Contract
* Test Case
