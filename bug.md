### 🚨 BUG REPORT TỔNG HỢP: LỖI LUỒNG THI (KẸT STATUS 400 KHI VÀO LẠI BÀI ĐÃ THI)

Hệ thống đang bị lỗi dây chuyền khi User bấm vào một bài thi mà họ ĐÃ HOÀN THÀNH trước đó. Dưới đây là chi tiết luồng lỗi và vị trí cần fix:

#### 1. Hiện tượng & Log lỗi chi tiết:
- **Bước 1 (Vừa vào trang thi):** API khởi tạo lượt thi báo lỗi 400 ngay lập tức.
  `POST /exams/[examId]/start -> 400 Bad Request` tại `startExam (src/services/api.ts:123)`
- **Bước 2 (Trong lúc làm bài):** Nếu user cố tình click chọn đáp án, API tiếp tục báo lỗi 400:
  `POST /api/v1/attempts/[attemptId]/answers -> 400 (Attempt is SUBMITTED, cannot modify)`
- **Bước 3 (Khi bấm nút Nộp bài):** API submit cuối cùng cũng trả về lỗi 400 và kẹt cứng UI kèm popup chặn rời trang:
  `POST /attempts/[attemptId]/submit -> 400 Bad Request` tại `submitAttempt (src/services/api.ts:169)`

#### 2. Nguyên nhân gốc rễ:
- **Backend (`AttemptsService`):** API `/exams/:examId/start` chưa xử lý trường hợp bài thi đã có lượt thi mang trạng thái `SUBMITTED`. Nó đang cố tình trả về hoặc xử lý tiếp trên Attempt đã đóng, dẫn đến ném lỗi `400`.
- **Frontend:** Chưa chặn user từ trang danh sách (vẫn cho bấm nút "Vào thi" dù đã thi rồi). Đồng thời khi dính lỗi 400 ở luồng submit, Frontend không hủy cơ chế `autosave` ngầm dẫn đến Race Condition gây nghẽn mạch redirect.

#### 3. Hướng dẫn Fix (Action Items):

👉 PHÍA BACKEND (NestJS):
- Tại API `POST /exams/:examId/start`: Cần kiểm tra xem user này đã có lượt thi `SUBMITTED` cho bài thi này chưa (nếu cấu hình bài thi chỉ cho làm 1 lần). 
  - Nếu đã nộp, thay vì quăng lỗi 400, hãy trả về một Response có cấu trúc rõ ràng, ví dụ: `{ success: false, code: 'ALREADY_SUBMITTED', message: 'Bạn đã nộp bài thi này' }` hoặc cho phép trả về data cũ kèm trạng thái `SUBMITTED` để Frontend biết đường xử lý.

👉 PHÍA FRONTEND (Next.js):
- **Tại trang danh sách bài thi:** Nếu bài thi đã có trạng thái đã nộp, đổi nút "Vào thi" thành "Xem kết quả" và router sang trang `/result`.
- **Tại `src/hooks/useExamSession.ts` (useEffect gọi `startExam`):** Đặt block `try...catch`. Nếu API `startExam` báo lỗi hoặc trả về status `SUBMITTED`, lập tức hiển thị thông báo "Bài thi đã hoàn thành" và điều hướng (`router.push`) thẳng user sang trang kết quả, không cho phép hiển thị giao diện làm bài nữa.
- **Tại nút Nộp bài (`handleConfirmSubmit`):** Tạo biến cờ `isSubmitting = true` để ngắt hoàn toàn các request `autosave` chạy ngầm, gỡ bỏ event `beforeunload` ngay khi submit thành công trước khi redirect.