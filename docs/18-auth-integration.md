# 18 — Ráp nối Đăng nhập với API Auth thật (coregenaihub)

> Chuẩn bị tích hợp đăng nhập thật từ hệ `dau-api-dev.coregenaihub.com` (đang phát
> triển). Hiện hệ thi đang dùng **dev-login** nội bộ; tài liệu này nêu ĐÚNG hợp đồng
> API thật và **những gì cần để ráp vào** khi API sẵn sàng.

## 1. Endpoint auth thật (từ Swagger `/docs-json`)

| Mục đích | Method + Path | Body | Trả về |
|---|---|---|---|
| Đăng nhập email/mật khẩu | `POST /api/auth/partner/login` | `{ email, password }` | `LoginPayloadDto` |
| Đăng nhập Google/Microsoft | `POST /api/auth/social/sign-in` | `{ provider, idToken }` | `LoginPayloadDto` |
| Cấp tài khoản partner | `POST /api/auth/partner/register` | (cần **SYSTEM_ADMIN**) | — |
| Làm mới token | `POST /api/auth/refresh-token` | refreshToken ở header | `TokenPayloadDto` |
| Thông tin user hiện tại | `GET /api/v1/auth/me` | Bearer | `UserDto` |
| Dev-login (non-prod) | `POST /api/auth/dev/yopmail-test-user` | `{ email }` | `LoginPayloadDto` |

Bảo mật: **Bearer JWT** cho mọi endpoint cần xác thực.

## 2. Hợp đồng dữ liệu — TRÙNG với hệ thi hiện tại ✅

```
LoginPayloadDto { user: UserDto, token: TokenPayloadDto }
TokenPayloadDto { accessToken, refreshToken, expiresIn }
UserDto { id, email, firstName, lastName, avatar, role, roles[], isActive, ... }
```

Đây **đúng y** kiểu dữ liệu `devLogin` của hệ thi đang trả về → ráp vào chỉ là đổi
**endpoint + base URL**, KHÔNG phải sửa logic xử lý token/role ở frontend.

## 3. Cách ráp (đề xuất)

**Khuyến nghị: proxy qua backend hệ thi** (không gọi thẳng từ trình duyệt):
```
FE  ──/api/auth/login {email,password}──►  Backend hệ thi
                                              └─► coregenaihub POST /api/auth/partner/login
                                              ◄─ LoginPayloadDto (giữ/đổi token, set role nội bộ)
FE ◄─ LoginPayloadDto
```
Lợi: giữ secret ở server, kiểm soát CORS, đồng bộ role nội bộ (STUDENT/INVIGILATOR/
EXAM_OFFICER/ADMIN), và **không phải đổi gì ở UI** (form email/mật khẩu đã có sẵn).

Cách thay thế: FE gọi thẳng coregenaihub (cần họ mở CORS cho origin của ta).

## 4. CẦN GÌ ĐỂ RÁP LIVE (checklist gửi đội API)

1. **Base URL** auth chính thức (gateway/host) + môi trường (dev/staging/prod).
2. **Tài khoản & vai trò:** sinh viên/giám thị/khảo thí thuộc luồng nào — `partner`
   (email+password) hay social? Cách cấp tài khoản hàng loạt (50+ sinh viên test).
   `partner/register` cần SYSTEM_ADMIN → ai cấp, hay có API import?
3. **Xác thực token phía ta:** để backend hệ thi tin token do họ phát:
   - JWKS/public key hoặc shared secret (`JWT_SECRET`) để verify, HOẶC
   - cho ta gọi `GET /api/v1/auth/me` kèm token để xác thực gián tiếp.
4. **Map vai trò:** giá trị `role`/`roles[]` họ trả ↔ 4 mã nội bộ của ta
   (STUDENT/INVIGILATOR/EXAM_OFFICER/ADMIN) — xem `backend/src/common/constants/roles.ts`.
5. **Social sign-in (nếu dùng):** Google/Microsoft **client ID** + luồng lấy `idToken`.
6. **Thời hạn token** (`expiresIn`) + luồng refresh (đã có `refresh-token`).
7. **CORS** nếu chọn gọi thẳng từ FE.

## 5. Trạng thái hiện tại (chưa có API thật)

- Hệ thi dùng **dev-login** nội bộ: form đăng nhập (tên đăng nhập + mật khẩu) +
  3 nút nhanh. Gõ tên ngắn (vd `sv001`) → tự thêm `@dau.edu.vn`; role suy theo email
  (invigilator→giám thị, khaothi/officer→khảo thí, admin→admin, còn lại→sinh viên).
- Khi có thông tin ở §4: thêm `POST /api/auth/login` ở backend hệ thi (proxy sang
  `partner/login`) + đổi `devLogin` → `login` ở `frontend/src/services/api.ts` qua cờ
  `AUTH_SOURCE=dev|partner`. Hợp đồng trùng nên **không đụng UI/giao diện**.
