# 🚀 CAIRA Examination System - Hướng dẫn chạy dự án (Development)

> Cập nhật: 09/07/2026

---

# Kiến trúc chạy Development

Development KHÔNG chạy toàn bộ bằng Docker.

Chỉ chạy:

- ✅ PostgreSQL (Docker)
- ✅ Redis (Docker)

Chạy bằng VSCode:

- ✅ Backend (NestJS)
- ✅ Frontend (Next.js)

Không chạy:

- ❌ Backend Docker
- ❌ Frontend Docker
- ❌ Nginx Docker

Kiến trúc:

Browser
↓
Frontend (localhost:3000)
↓
Backend (localhost:3001)
↓
PostgreSQL + Redis (Docker)

---

# 1. Mở Docker Desktop

Đảm bảo Docker Desktop đã Start.

---

# 2. Chạy PostgreSQL + Redis

Mở CMD hoặc PowerShell

```bash
cd D:\Change_C_to_D\Downloads\caira-khaothi-test-develop
```

Chạy

```bash
docker compose up -d postgres redis
```

Kiểm tra

```bash
docker ps
```

Kết quả mong muốn

```
dau-exam-postgres
dau-exam-redis
```

Nếu backend/frontend đang chạy trong Docker thì tắt

```bash
docker compose stop backend frontend
```

---

# 3. Chạy Backend

Mở Terminal 1

```bash
cd backend
```

Chạy

```bash
npm run start:dev
```

Backend

```
http://localhost:3001
```

Swagger

```
http://localhost:3001/api/docs
```

---

# 4. Chạy Frontend

Mở Terminal 2

```bash
cd frontend
```

Chạy

```bash
npm run dev
```

Frontend

```
http://localhost:3000
```

---

# 5. Đăng nhập

Mở

```
http://localhost:3000
```

Nếu bị logout hoặc lỗi 401

- kiểm tra Backend còn chạy không
- kiểm tra Database
- đăng nhập lại

---

# 6. Quality Check

## Backend Test

```bash
cd backend

npm run test
```

Kết quả mong muốn

```
14 Test Suites PASS
160 Tests PASS
```

---

## Frontend Test

```bash
cd frontend

npm test -- --run
```

Kết quả mong muốn

```
9 Test Files PASS
77 Tests PASS
```

---

## Backend Coverage

```bash
npm run test:cov
```

---

## Frontend Coverage

```bash
npm test -- --run --coverage
```

---

## Backend Lint

```bash
npm run lint
```

---

## Frontend Lint

```bash
npm run lint
```

---

## Type Check

```bash
npx tsc --noEmit
```

---

# 7. Manual QA Checklist

## Authentication

- [ ] Login
- [ ] Logout
- [ ] Refresh Token
- [ ] Token hết hạn

---

## Student Exam

- [ ] Danh sách đề
- [ ] Start Exam
- [ ] Resume Exam
- [ ] Autosave
- [ ] Submit
- [ ] Result
- [ ] Review

---

## Question

- [ ] Single Choice
- [ ] Multiple Choice
- [ ] True/False
- [ ] Essay
- [ ] Image
- [ ] Video
- [ ] Audio

---

## RichText

- [ ] HTML
- [ ] Table
- [ ] Math
- [ ] XSS

Ví dụ

```html
<img src=x onerror=alert(1)>
```

Không được popup.

---

## Admin

- [ ] Create Exam
- [ ] Update Exam
- [ ] Delete Exam
- [ ] Publish Exam

---

## Reporting

- [ ] Dashboard
- [ ] Chart
- [ ] Export

---

# 8. Khi debug

Luôn mở

- Chrome DevTools
- Network
- Console
- Backend Terminal
- Swagger
- PostgreSQL

Theo dõi

- Request
- Response
- Status Code
- Backend Log

---

# 9. Khi kết thúc làm việc

Dừng Backend

```
Ctrl + C
```

Dừng Frontend

```
Ctrl + C
```

Tắt Docker

```bash
docker compose down
```

---

# Quy trình mỗi ngày

```
Mở Docker Desktop
        │
        ▼
docker compose up -d postgres redis
        │
        ▼
Backend

cd backend
npm run start:dev
        │
        ▼
Frontend

cd frontend
npm run dev
        │
        ▼
Browser

http://localhost:3000
        │
        ▼
Đăng nhập
        │
        ▼
Code + Debug
```

---

# Ghi chú

Hiện tại Development Mode sử dụng:

| Thành phần | Cách chạy |
|------------|-----------|
| PostgreSQL | Docker |
| Redis | Docker |
| Backend | VSCode |
| Frontend | VSCode |
| Nginx | Không chạy |
| Backend Docker | Không chạy |
| Frontend Docker | Không chạy |

Đây là cách chạy chuẩn để có Hot Reload và Debug dễ dàng.