# Rollback Plan — DAU Examination System

Tài liệu rollback theo template **Feature Plan** (Mục 4.4) và quy tắc **SemVer rollback**
(Mục 6.5 — Quy trình CAIRA-DAU v1.0): *"Rollback trong < 5 phút — giảm rủi ro user-facing
là ưu tiên trước, fix gốc rễ là việc của ngày hôm sau."*

## 1. Nguyên tắc

- Mỗi lần merge vào `main` đều **tag SemVer** (`vX.Y.Z`). Rollback = deploy lại tag liền kề trước.
- KHÔNG "hotfix forward" khi vẫn còn thời gian rollback.
- Hotfix từ `main` phải **sync ngược về `develop`** ngay sau (tránh code drift).

## 2. Rollback ứng dụng (code)

| Tình huống | Hành động |
|---|---|
| Lỗi phát hiện ngay sau deploy | `git revert <merge-commit>` trên `main` → re-deploy, hoặc deploy lại tag trước (`vX.Y.(Z-1)`) qua job "deploy by tag". |
| Cần quay về nhanh | Trỏ deploy về Docker image tag liền trước (registry `ghcr.io`). |
| Feature lỗi cục bộ | Revert đúng commit feature (lịch sử commit theo Conventional Commits, dễ truy vết). |

## 3. Rollback cơ sở dữ liệu (Prisma)

Thay đổi schema trong bản 0.1.0: **thêm cột `Exam.deletedAt DateTime?`** — đây là thay đổi
**cộng thêm, tương thích ngược** (nullable, không phá dữ liệu cũ).

- **Rollback an toàn:** có thể **giữ nguyên cột** `deletedAt` ngay cả khi rollback code —
  code cũ không dùng cột này, không gây lỗi. → Không bắt buộc migrate ngược.
- Nếu bắt buộc gỡ: `ALTER TABLE "Exam" DROP COLUMN "deletedAt";` (chỉ khi chắc chắn không
  còn bản ghi nào dựa vào soft-delete).
- **Lưu ý dữ liệu:** sau khi bật soft-delete, các đề "đã xóa" chỉ set `deletedAt` (không mất
  vật lý). Rollback về code xóa-cứng KHÔNG khôi phục được đề đã hard-delete trước đó — nhưng
  từ 0.1.0 trở đi không còn hard-delete.

## 4. Thành phần mới cần lưu ý khi rollback

| Thành phần | Rollback |
|---|---|
| Cron auto-submit (`@nestjs/schedule`) | Rollback code là đủ — cron biến mất cùng bản build cũ. Không có state ngoài DB. |
| Swagger `/api/docs` | Chỉ tài liệu, không ảnh hưởng runtime nghiệp vụ. |
| CI coverage gate (`ci.yml`) | Thuần CI, không ảnh hưởng production. |

## 5. Checklist rollback (≤ 5 phút)

1. [ ] Xác định tag/commit ổn định gần nhất.
2. [ ] Deploy lại tag đó (job "deploy by tag") hoặc `git revert` + re-deploy.
3. [ ] Smoke test luồng chính (đăng nhập → làm bài → nộp → xem kết quả).
4. [ ] Giữ nguyên cột `deletedAt` (không cần migrate ngược).
5. [ ] Mở ticket Jira ghi nhận nguyên nhân + kế hoạch fix gốc rễ.
6. [ ] Nếu hotfix trên `main`: sync ngược về `develop`.
