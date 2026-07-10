# Note: Tạm thời bỏ gọi API `/api/v1/violations`

## Ngày

2026-07-09

## Bối cảnh

Trong `frontend/src/hooks/useExamSecurity.ts` trước đây có gọi:

```ts
fetch('/api/v1/violations', ...)
```

để log các hành vi vi phạm (blur, visibilitychange, DevTools...).

---

## Vì sao bỏ?

### 1. Sai host

Đây là **relative path**.

```
/api/v1/violations
```

nên request được gửi tới:

```
http://localhost:3000/api/v1/violations
```

(thay vì backend)

Trong khi backend chạy ở:

```
http://localhost:3001
```

Kết quả:

- Next.js trả về trang 404 HTML
- DevTools xuất hiện rất nhiều request 404
- Không ghi nhận được vi phạm nào

---

### 2. Dù sửa host cũng vẫn KHÔNG hoạt động

Backend endpoint:

```
POST /api/v1/violations
```

(yêu cầu DTO của mô hình cũ)

Controller yêu cầu:

- studentId
- sessionId
- roomId

đều là UUID hợp lệ và bật:

```
forbidNonWhitelisted: true
```

=> gửi thiếu hoặc gửi field khác sẽ bị 400.

---

### 3. Frontend hiện tại không có dữ liệu đó

Hook `useExamSecurity` hiện chỉ có:

```
attemptId
```

Không có:

- studentId
- sessionId
- roomId

Caller (`page.tsx`) cũng không truyền các giá trị này.

=> Không thể gọi endpoint hiện tại.

---

## Kết luận

API violations hiện tại được thiết kế cho mô hình:

```
Student
    ↓
Session
    ↓
Room
```

Trong khi luồng thi hiện tại đã chuyển sang:

```
Student
    ↓
Attempt
```

Hai mô hình chưa được đồng bộ.

---

## Giải pháp tạm thời

Không gọi API nữa.

Trong `useExamSecurity.ts`:

- bỏ fetch()
- chỉ `console.warn(...)` khi phát hiện vi phạm

Nhờ vậy:

- không còn request 404
- không còn spam network
- không còn log lỗi
- toàn bộ chức năng chặn:
  - DevTools
  - Right click
  - Blur
  - Visibility change
  - Before unload

vẫn hoạt động bình thường.

---

## Khi nào cần mở lại?

Khi backend có endpoint mới theo mô hình Attempt.

Ví dụ:

```
POST /attempts/:attemptId/violations
```

payload có thể là:

```json
{
  "type": "TAB_SWITCH",
  "timestamp": "...",
  "metadata": {}
}
```

hoặc

```
POST /violations
{
    attemptId,
    type,
    timestamp
}
```

Khi đó chỉ cần sửa lại `logViolation()` để gọi API mới.

---

## Không nên làm

❌ Chỉ sửa URL sang:

```
NEXT_PUBLIC_API_URL/api/v1/violations
```

vì vẫn sẽ nhận HTTP 400 do thiếu:

- studentId
- sessionId
- roomId

=> Không giải quyết được vấn đề.

---

## Trạng thái hiện tại

Đây **không phải bug của frontend**.

Đây là sự không tương thích giữa:

- API violations (mô hình Session/Room cũ)
- Luồng thi hiện tại (mô hình Attempt)

Cho đến khi backend cung cấp endpoint theo Attempt, frontend sẽ **không gọi API violations**.
