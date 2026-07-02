<!--
  Checklist tuân theo "Quy trình phát triển phần mềm CAIRA-DAU v1.0" — Phụ lục B.
  Áp dụng cho mọi PR vào nhánh develop. Tick từng mục trước khi nhấn "Create Pull Request".
-->

## 📋 Mô tả thay đổi

<!-- Làm gì + tại sao (WHY, không chỉ WHAT) -->

## 🔗 Liên kết

- Jira ticket: PROJ-
- Brief / Feature Plan (Docs Host):
- Closes #

## 🏷️ Loại thay đổi

- [ ] 🐛 Bug fix
- [ ] ✨ New feature
- [ ] 💥 Breaking change
- [ ] 📝 Documentation
- [ ] ♻️ Refactor
- [ ] 🧪 Test

## 📸 Screenshots / Demo (cho UI changes)

| Before | After |
|--------|-------|
|        |       |

## 🧪 Cách test thủ công

<!-- Các bước reviewer có thể chạy lại để xác minh -->

## 🔁 Breaking changes / Migration / Rollback (nếu có)

<!-- Nêu rõ migration DB hoặc thay đổi config + cách rollback -->

---

## ✅ Checklist trước khi mở PR (19 mục — Phụ lục B)

### Code và Test
- [ ] Code đã pass toàn bộ unit test.
- [ ] Code đã pass integration test (nếu có).
- [ ] Coverage ≥ 80% cho code mới.
- [ ] Đã chạy lint và type-check, không còn warning.
- [ ] Đã xoá code chết, `console.log`, comment debug.

### Documentation
- [ ] Swagger đã có description cho mọi endpoint mới / sửa.
- [ ] README và docs liên quan đã được cập nhật.
- [ ] Implementation plan đã commit vào `docs/impl-plans/`.

### Jira
- [ ] User Story đã ở trạng thái "In Review".
- [ ] Tất cả Acceptance Criteria đều đã được verify.
- [ ] Comment kết quả test và screenshot trong ticket.

### Git
- [ ] Branch name đúng quy ước (`feat/PROJ-xxx-…`).
- [ ] Commit messages theo Conventional Commits.
- [ ] Đã rebase với `develop` mới nhất, không có conflict.
- [ ] PR target đúng branch `develop` (không phải main/staging/QA).
- [ ] PR title chứa Jira key.

### Self-review
- [ ] Đã tự review diff của chính mình trên GitHub.
- [ ] Đã thêm reviewer phù hợp (CODEOWNERS gợi ý).
- [ ] PR description đầy đủ: gì, tại sao, cách test.
