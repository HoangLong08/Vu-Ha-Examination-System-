# 🚀 Git Workflow - CAIRA Examination System

> Quy trình chuẩn để thực hiện một task từ lúc bắt đầu đến khi merge.

---

# 1. Đồng bộ nhánh dev

```bash
git checkout dev
git pull origin dev
```

Kiểm tra:

```bash
git status
```

Kết quả mong muốn:

```
On branch dev
Your branch is up to date with 'origin/dev'.

nothing to commit, working tree clean
```

---

# 2. Tạo Feature Branch

Đặt tên branch theo đúng nghiệp vụ.

Ví dụ:

```bash
git checkout -b feature/max-attempt-error-handling
```

hoặc

```bash
git checkout -b feature/exam-result-navigation
```

hoặc

```bash
git checkout -b fix/exam-start-validation
```

Kiểm tra:

```bash
git branch
```

---

# 3. Coding

- Đọc SRS
- Đọc tài liệu
- Code
- Test
- Self Review

---

# 4. Kiểm tra trước khi Commit

```bash
git status
```

```bash
git diff
```

Đảm bảo:

- Không còn debug
- Không còn console.log
- Không còn code chết

---

# 5. Commit

Stage

```bash
git add .
```

Commit

Ví dụ:

```bash
git commit -m "fix(exam): improve exam attempt limit error handling"
```

Một số commit chuẩn

Bug

```text
fix(exam): improve exam attempt limit error handling
```

Feature

```text
feat(exam): support exam recovery
```

Refactor

```text
refactor(exam): simplify exam session logic
```

Docs

```text
docs: update run project guide
```

Test

```text
test(exam): add max attempt lifecycle tests
```

---

# 6. Push

Lần đầu

```bash
git push -u origin feature/<branch-name>
```

Ví dụ

```bash
git push -u origin feature/max-attempt-error-handling
```

Các lần sau

```bash
git push
```

---

# 7. Tạo Pull Request

Source

```
feature/xxxxx
```

↓

Target

```
dev
```

Không merge vào master.

---

# 8. PR Title

Ví dụ

```
fix(exam): improve exam attempt limit error handling
```

---

# 9. PR Description

## Summary

- Explain what changed.
- Explain why.
- Explain how to test.

Ví dụ

- Keep existing business rules unchanged.
- Improve frontend UX.
- Add backend tests.
- Add frontend tests.

---

# 10. Reviewer

Nếu công ty có reviewer

Assign reviewer

↓

Review

↓

Approve

↓

Merge

---

# 11. Merge

GitHub Merge Commit

```
Merge pull request #xx from feature/xxxx
```

Không cần sửa.

Extended Description có thể ghi

```
Summary

- Improve business error handling
- Improve frontend UX
- Add automated tests
```

---

# 12. Sau khi Merge

Chuyển về dev

```bash
git checkout dev
```

Pull

```bash
git pull origin dev
```

Kiểm tra

```bash
git status
```

Kết quả

```
Your branch is up to date with 'origin/dev'
```

---

# 13. Xóa Branch (Optional)

Local

```bash
git branch -d feature/max-attempt-error-handling
```

Remote

```bash
git push origin --delete feature/max-attempt-error-handling
```

Chỉ xóa sau khi PR đã merge.

---

# 14. Quy trình chuẩn

```
dev
 │
 │ pull
 ▼
feature/xxxx
 │
 │ code
 │
 │ test
 │
 │ commit
 │
 │ push
 ▼
Pull Request
 │
 ▼
dev
 │
 │ merge
 ▼
git pull origin dev
 │
 ▼
Task tiếp theo
```

---

# Checklist trước khi Push

✅ Đã đọc nghiệp vụ

✅ Đã test

✅ Không còn debug

✅ Không còn console.log

✅ Commit đúng Conventional Commits

✅ PR vào dev

✅ Self Review

---

# Prompt chuẩn giao AI Agent

Task

- Explain the business rule.
- Explain expected behavior.
- Explain constraints.
- Explain acceptance criteria.

Ví dụ

Business Rules
- Keep FR-Q-003 unchanged.

Requirements
- Improve UX.
- Do not modify grading logic.
- Do not modify submit flow.

Tests
- Backend tests.
- Frontend tests.

Expected Result
- Friendly UI.
- No AxiosError.
- Existing business rules preserved.