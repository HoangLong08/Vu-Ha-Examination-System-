## 📋 Mô tả thay đổi

Giao phân hệ **Thi trắc nghiệm** (Grading Engine + UI làm bài) kèm bộ kiểm thử QC theo chuẩn CAIRA-DAU v1.0.
Lý do (WHY): bản scaffold trước đó **không chấm điểm được** (điểm luôn 0) và **lộ đáp án** — đây là các lỗ hổng chặn nghiệp vụ. PR này khắc phục và đưa QC verdict về **ĐẠT SIGN-OFF**.

## 🔗 Liên kết
- Jira ticket: PROJ- (cập nhật khi tạo)
- Brief / Feature Plan (Docs Host): `docs/15-test-report-wave2-trac-nghiem.md`
- US: US-047..052, US-054, US-074, US-076..079

## 🏷️ Loại thay đổi
- [x] ✨ New feature  · [x] 🐛 Bug fix · [x] 🧪 Test · [x] 📝 Documentation

## 🧪 Cách test thủ công
```bash
# Backend
cd backend && npm ci && npx prisma generate && npm test && npm run test:cov
# Frontend
cd frontend && npm ci && npx vitest --run
```
Kết quả kỳ vọng: **Backend 91/91, Frontend 36/36 pass**; coverage gate xanh.

## 🔁 Migration / Rollback
- DB: thêm cột `Exam.deletedAt DateTime?` (additive, tương thích ngược). Rollback chi tiết: `docs/13-rollback.md`.

## ✅ Checklist (Phụ lục B)
- [x] Unit test pass (127/127) · [x] Coverage ≥80% code mới (gate scoped) · [x] Lint/type-check sạch
- [x] Swagger mọi endpoint (`/api/docs`) · [x] Docs cập nhật (CHANGELOG, ROLLBACK, QC report)
- [x] Conventional Commits · [x] PR target `develop`
- [ ] Integration test (Supertest) — **chưa có**, khuyến nghị bổ sung trước UAT

## ⚠️ Known issues (backlog, không chặn sign-off)
- BUG-BE-007 (`sessionId`/`studentId` placeholder), BUG-BE-008 (mock path), Integration test.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
