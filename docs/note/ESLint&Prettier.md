# Code Quality & Git Hooks Guide

## Frontend

```bash
cd frontend
npm install
```

### Kiểm tra ESLint

```bash
npm run lint
```

- Kiểm tra lỗi và warning.
- Không chỉnh sửa source code.

---

### Kiểm tra format

```bash
npm run format:check
```

- Kiểm tra file nào chưa đúng format.
- Không chỉnh sửa source code.

---

### Tự sửa ESLint

```bash
npm run lint:fix
```

- Tự sửa các lỗi ESLint có thể fix.

---

### Format code

```bash
npm run format
```

- Format toàn bộ source code theo Prettier.

---

## Backend

```bash
cd backend
npm install
```

### Kiểm tra ESLint

```bash
npm run lint
```

---

### Kiểm tra format

```bash
npm run format:check
```

---

### Tự sửa ESLint

```bash
npm run lint:fix
```

---

### Format code

```bash
npm run format
```

---

# Husky + lint-staged

Repository đã được cấu hình Husky và lint-staged.

Khi commit:

```bash
git add .
git commit -m "feat: ..."
```

Git sẽ tự động chạy:

```
pre-commit
    ↓
lint-staged
    ├── ESLint (--fix)
    └── Prettier (--write)
```

### Hành vi

- Chỉ kiểm tra các file đã `git add`.
- Tự động fix lỗi ESLint có thể sửa.
- Tự động format bằng Prettier.
- Nếu ESLint lỗi → commit bị hủy.
- Nếu thành công → commit tiếp tục.

Không cần format hoặc lint toàn bộ project trước mỗi commit.

---

# Quy trình làm việc khuyến nghị

## Khi phát triển

Trong lúc code:

```bash
npm run lint
```

hoặc

```bash
npm run format:check
```

nếu muốn kiểm tra thủ công.

---

## Trước khi commit

```bash
git add .
git commit -m "fix(exam): ..."
```

Husky sẽ tự động:

- chạy ESLint trên các file đã stage.
- chạy Prettier trên các file đã stage.
- hủy commit nếu có lỗi.

---

## Khi cần chuẩn hóa toàn bộ project

Frontend

```bash
cd frontend

npm run lint:fix
npm run format
```

Backend

```bash
cd backend

npm run lint:fix
npm run format
```

Chỉ sử dụng khi muốn chuẩn hóa toàn bộ codebase hoặc sau khi cập nhật cấu hình ESLint/Prettier.

---

# Quy ước

### Kiểm tra

```bash
npm run lint
npm run format:check
```

### Tự sửa

```bash
npm run lint:fix
npm run format
```

### Commit

```bash
git add .
git commit -m "type(scope): message"
```

Ví dụ:

```text
feat(auth): add refresh token support
fix(exam): prevent duplicate submission
style(frontend): format codebase
chore: update Husky configuration
```
