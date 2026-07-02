# Checklist Go-live & Hướng dẫn triển khai (Production)

> Mục tiêu: đưa hệ thống từ **demo/giả lập** sang **chạy thật** an toàn.
> Liên quan: [`backend/.env.production.example`](../backend/.env.production.example),
> [`frontend/.env.production.example`](../frontend/.env.production.example),
> [19-huong-dan-su-dung](19-huong-dan-su-dung.md), [17-exam-core-integration](17-exam-core-integration.md),
> [18-auth-integration](18-auth-integration.md), [13-rollback](13-rollback.md).

---

## A. Checklist Go-live (làm THEO THỨ TỰ, đánh ✔ từng mục)

### 1. Bí mật & cấu hình
- [ ] Tạo `backend/.env` từ `.env.production.example`, điền **giá trị thật**.
- [ ] `JWT_SECRET` & `JWT_REFRESH_SECRET` = chuỗi ngẫu nhiên mạnh (`openssl rand -hex 48`), **khác** giá trị demo.
- [ ] `DATABASE_URL` trỏ Postgres production (tài khoản riêng, mật khẩu mạnh, SSL nếu ở xa).
- [ ] `FRONTEND_URL` = domain thật (https).
- [ ] `frontend/.env.production` đặt `NEXT_PUBLIC_API_URL` = domain API thật (https).
- [ ] KHÔNG commit file `.env` thật.

### 2. Tích hợp thật (KT&ĐBCL + đăng nhập)
- [ ] Có **token exam-core** (scope `EXAM_QUALITY_*`) → đặt `EXAM_CORE_TOKEN`, `EXAM_SOURCE=exam-core`.
- [ ] Gọi thử `GET {EXAM_CORE_BASE_URL}/...` bằng token → 200 (không 401).
- [ ] `AUTH_SOURCE=partner` + `AUTH_PARTNER_BASE` đúng; đăng nhập thử 1 tài khoản thật.
- [ ] Gắn `examCoreBankId`/`examCoreMatrixId` cho các đề (qua màn Khảo thí → Chi tiết đề).

### 3. Cơ sở dữ liệu
- [ ] Postgres production đã tạo, backup tự động bật.
- [ ] Chạy migrations: `npx prisma migrate deploy` (KHÔNG dùng `db push` ở prod).
- [ ] (Tuỳ chọn) Seed dữ liệu nền tối thiểu (phòng thi, kỳ/đợt) — KHÔNG seed tài khoản/đề demo.

### 4. Build & chạy
- [ ] Backend: `npm ci && npx prisma generate && npm run build && node dist/main` (không dev mode).
- [ ] Frontend: `npm ci && npm run build && npm run start` (đã set `NEXT_PUBLIC_API_URL` trước khi build).
- [ ] Reverse proxy (Nginx/Caddy) + **HTTPS** cho cả frontend và API.
- [ ] CORS: backend cho phép `FRONTEND_URL`.

### 5. Kiểm thử nghiệm thu (UAT) trên môi trường thật
- [ ] Đăng nhập thật (3 vai trò: sinh viên / giám thị / khảo thí).
- [ ] Sinh viên: vào thi → làm → nộp → xem điểm (đề thật từ exam-core).
- [ ] Khảo thí: thấy bài làm, báo cáo, công bố điểm.
- [ ] Giám thị: thấy phòng, cấp lại mật khẩu, đổi máy.
- [ ] Mất mạng/đổi máy giữa giờ → khôi phục đúng tiến độ.

### 6. Vận hành & an toàn
- [ ] Log tập trung; theo dõi lỗi (5xx).
- [ ] Backup DB trước mỗi kỳ thi lớn.
- [ ] Có **kế hoạch rollback** (xem [13-rollback](13-rollback.md)).
- [ ] Giới hạn IP phòng thi nếu cần (`ALLOWED_IP_RANGES`).
- [ ] Rà soát quyền (chỉ khảo thí/admin vào trang quản trị).

---

## B. Hướng dẫn triển khai

### B.1. Yêu cầu
- Node.js 20, PostgreSQL 16, (tuỳ chọn) Redis.
- Domain + chứng chỉ HTTPS cho frontend và API.

### B.2. Backend
```bash
cd backend
cp .env.production.example .env      # rồi điền giá trị thật
npm ci
npx prisma generate
npx prisma migrate deploy            # áp schema lên DB production
npm run build                        # nest build -> dist/
node dist/main                       # chạy (nên đặt sau process manager: pm2/systemd/container)
```

### B.3. Frontend
```bash
cd frontend
cp .env.production.example .env.production   # đặt NEXT_PUBLIC_API_URL = domain API thật
npm ci
npm run build                        # next build (nhúng NEXT_PUBLIC_* lúc này)
npm run start                        # next start (cổng 3000 mặc định)
```

### B.4. Reverse proxy (gợi ý Nginx)
- `https://thi.dau.edu.vn` → frontend (cổng 3000).
- `https://api.thi.dau.edu.vn` → backend (cổng 3001).
- Bật HTTPS (Let's Encrypt). Đảm bảo `FRONTEND_URL` và `NEXT_PUBLIC_API_URL` khớp domain.

### B.5. Lật từ DEMO sang THẬT (tóm tắt)
| Hạng mục | Demo | Thật |
|---|---|---|
| Nguồn đề | `EXAM_SOURCE=mock` (fixture) | `EXAM_SOURCE=exam-core` + `EXAM_CORE_TOKEN` |
| Đăng nhập | `AUTH_SOURCE=dev` | `AUTH_SOURCE=partner` + `AUTH_PARTNER_BASE` |
| DB | docker dev + `db push` | Postgres prod + `migrate deploy` |
| Secrets | giá trị demo | `JWT_*` ngẫu nhiên mạnh |
| Build | `start:dev` (hot-reload) | `build` + `start`/`node dist/main` |

> Code adapter exam-core/auth đã contract-first sẵn — khi có token chỉ cần **đổi cờ + điền .env**, không phải sửa code lõi.

---

## C. Trạng thái hiện tại (tính đến khi viết)
- ✅ Code đầy đủ trên `main`, CI xanh (gồm **UAT e2e Postgres thật**).
- ⏳ Đang chạy **chế độ demo** (fixture + dev-login) vì **chưa có token** exam-core/auth.
- ➡️ Go-live = hoàn tất mục **A** ở trên (chủ yếu là cấu hình + token, không phải code).
