# DAU Examination System — Phân luồng Role & Quy trình Phát triển

Tài liệu này chuẩn hóa quy trình phát triển và các yêu cầu nghiệp vụ bắt buộc đối với hệ thống Dashboards phân quyền, áp dụng từ Sprint 2 trở đi.

## 1. QUY TRÌNH PHÁT TRIỂN & QA BẮT BUỘC

Để tránh lỗi routing và đảm bảo chất lượng phần mềm, toàn bộ quy trình code bắt buộc phải tuân theo luồng sau:
1. **Agent Backend & Frontend** thực hiện code logic và giao diện.
2. **Bắt buộc: Agent Tester QA** phải được khởi động để chạy End-to-End test:
   - Dùng curl/script đăng nhập giả lập vào 3 Role khác nhau.
   - Xác thực việc chuyển hướng (Redirect) đúng về các Dashboard tương ứng.
   - Xác nhận file gốc (`page.tsx`) không bị xung đột với các route con.
3. Nhóm AI báo cáo kết quả test thành công 100% thì mới được mời User (Khách hàng) vào nghiệm thu.

---

## 2. CHUẨN HÓA DASHBOARD THEO ROLE

Hệ thống điều hướng người dùng ngay sau khi Đăng nhập thành công dựa vào `Role` của họ.

### 2.1. Sinh viên (STUDENT)
**Route mặc định:** `/` (Student Dashboard)

**Yêu cầu tính năng Dashboard:**
- **Thẻ thông tin sinh viên**: Hiển thị rõ ràng: Ảnh đại diện (Avatar), Họ và tên, Lớp sinh hoạt, Khoa, Ngày sinh.
- **Danh sách bài thi**: Hiển thị các bài thi được gán cho sinh viên.
- **Logic nút "Vào thi" (Nghiêm ngặt)**:
  - Nếu `Thời gian hiện tại < Thời gian bắt đầu thi`: Nút bị vô hiệu hóa (disabled), đổi sang màu xám, không thể bấm.
  - Nếu đến giờ thi: Nút phát sáng, có animation mời gọi click.

**Yêu cầu tính năng Trong phòng thi (Exam Room):**
- **Bố cục 3 Cột (Chuyên nghiệp, Chống phân tâm)**: 
  - **Cột Trái**: Thông tin tĩnh của Sinh viên & Thông tin tóm tắt đề thi.
  - **Cột Giữa**: Nội dung câu hỏi và khu vực chọn đáp án.
  - **Cột Phải**: Lưới câu hỏi (Navigation) kết hợp chú thích trạng thái (Màu xanh: đã chọn, Màu vàng: Đánh dấu), và Nút nộp bài cố định (sticky).
- **Trải nghiệm Nộp bài (Smart Submit)**: Khi bấm nộp bài, hiển thị Modal xác nhận có chứa thống kê cụ thể: Số câu đã làm, số câu chưa làm. Cảnh báo màu vàng nếu làm thiếu câu, và thông báo màu xanh lá nếu đã hoàn thành 100%.
- **Sau khi thi xong**: Sinh viên được trả về một Result Dashboard riêng biệt hiển thị điểm số và cho phép xem lại các câu đã làm (nếu kỳ thi cho phép).

### 2.2. Cán bộ coi thi (INVIGILATOR)
**Route mặc định:** `/invigilator` (Invigilator Dashboard)

**Yêu cầu tính năng:**
- **Danh sách phòng thi**: Hiển thị các phòng thi được phân công gác thi trong ngày, **được chia theo Ca thi (Shift 1, Shift 2)**.
- **Trạng thái Real-time của Sinh viên**: Khi bấm vào một phòng thi, cán bộ thấy được danh sách sinh viên với trạng thái và thông tin thiết bị thời gian thực nhằm mô phỏng chuẩn xác môi trường thi tại phòng máy (Local/Lab Environment):
  - ⚪ **Chưa đăng nhập**: Không có IP, không có thời gian.
  - 🔵 **Đã đăng nhập / Sẵn sàng**: Nhận diện tên máy (VD: `PC-01`), Địa chỉ IP nội bộ (VD: `192.168.1.45`), Tiến độ chờ thi (0/40).
  - 🟡 **Đang làm bài**: Hiển thị đồng hồ đếm ngược thời gian làm bài (VD: `45:23`), Thanh tiến trình (Progress Bar) thu nhỏ hiển thị trực quan tỷ lệ % số câu đã hoàn thành.
  - 🟢 **Đã nộp bài**: Thời gian đếm ngược về `00:00`, Tiến độ đạt 100%, ghi nhận hoàn tất.
- **Công cụ Hỗ trợ và Xử lý Sự cố (Khẩn cấp)**:
  - **Đổi mật khẩu (Reset Password)**: Khi sinh viên quên mật khẩu, cán bộ bấm nút để hệ thống tự động sinh một mật khẩu ngẫu nhiên hiển thị trên màn hình để cung cấp lại cho sinh viên.
  - **Khôi phục phiên đăng nhập (Reset Session / Mở khóa máy)**: Xử lý tình huống máy tính của sinh viên bị hỏng giữa chừng. Giám thị sẽ dùng chức năng này để buộc hệ thống đăng xuất sinh viên khỏi máy cũ (bị hỏng) để sinh viên có thể tiếp tục đăng nhập vào một máy mới.
  - **Lập biên bản vi phạm**: Cảnh cáo hoặc tạm đình chỉ bài thi của sinh viên.

### 2.3. Cán bộ khảo thí / Quản trị (EXAM_OFFICER / ADMIN)
**Route mặc định:** `/admin` (Admin Dashboard)

**Yêu cầu tính năng:**
- **Bố cục Tabbed Navigation hiện đại**: Dashboard được chia thành 3 tab chính:
  1. **Tổng quan (Overview)**: Các thẻ thống kê số liệu (Số đề thi, SV hoạt động, Kỳ thi đang diễn ra, Uptime).
  2. **Ngân hàng Đề thi (Exam Sets)**: Danh sách các bộ đề. Hiển thị thông tin Mã đề, Môn học, Số câu hỏi, Độ khó và Trạng thái (Draft/Approved). Hỗ trợ các thao tác (Xem, Sửa, Xóa).
  3. **Lịch thi (Schedules)**: Quản lý các phân công thi thực tế. Hiển thị thông tin Mã ca, Kỳ thi, Ngày thi, Ca thi (Shift), Phòng thi, Giám thị phụ trách và Trạng thái (Upcoming/Ongoing).
- **Tính đồng bộ dữ liệu**: Lịch thi ở Tab Schedules phải đồng bộ 100% với dữ liệu hiển thị bên màn hình Giám thị (Invigilator Dashboard).
- **Truy xuất báo cáo (Tính năng tương lai)**: Xem phổ điểm, xuất file Excel kết quả toàn trường.
