# 12. Quy ước Frontend (UI + Code)

Tài liệu **bắt buộc tuân thủ** cho mọi thay đổi ở `frontend/`. Mục tiêu: giữ giao diện
nhất quán và tránh lặp lại các lỗi quy ước (vd dùng emoji làm icon). Bổ sung cho
[09-design-system.md](09-design-system.md). Áp dụng cho cả Dev và AI agent (xem `frontend/AGENTS.md`).

> Nếu một thay đổi vi phạm quy ước ở đây → reviewer được phép **reject PR**.

---

## PHẦN A — Quy ước UI / Design

### A.1 Icon — CHỈ dùng Lucide React ⛔ KHÔNG emoji

**Quy tắc cứng:** mọi icon trong JSX phải là component từ `lucide-react`. **TUYỆT ĐỐI
không** dùng emoji / ký tự unicode làm icon — kể cả `✓ ✗ — 📘 📐 👤 📝 📤 🔖 ⏱ ❓ ⚠️ ✅`.

> ⚠️ Bảng "Ngữ cảnh / Icon / Tên Lucide" ở [design-system §6](09-design-system.md) — **cột
> emoji chỉ để TRA CỨU chọn tên Lucide**, KHÔNG được copy vào code. Đây chính là nguồn lỗi
> đã xảy ra (code copy nguyên emoji thay vì dùng component Lucide tương ứng).

```tsx
// ✅ ĐÚNG
import { Check, BookOpen, Send, Bookmark } from 'lucide-react';
<Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
<BookOpen className="w-6 h-6 text-blue-500" />

// ❌ SAI — emoji làm icon
<span>✓</span>
<div className="text-2xl">📘</div>
<button>📤 NỘP BÀI</button>
```

**Map nhanh** (tra thêm tại design-system §6): `👤 User` · `📝 ClipboardList`/`FileText` ·
`📘 BookOpen` · `📐 Triangle` · `🔖 Bookmark` · `📤 Send` · `✓ Check` · `✗ X` · `— Minus` ·
`⏱ Clock` · `❓ HelpCircle` · `⚠️ AlertTriangle` · `✅ CheckCircle` · `🌙 Moon` · `☀️ Sun`.

**Cách dùng:** kích thước bằng `className="w-4 h-4"` (KHÔNG dùng `text-2xl` để chỉnh cỡ icon
như với emoji); màu bằng `text-*` Tailwind hoặc biến CSS; độ đậm nét bằng `strokeWidth`.

### A.2 Ngoại lệ hợp lệ của "chỉ Lucide" (KHÔNG tính vi phạm)

| Trường hợp | Cách làm | Lý do |
|---|---|---|
| Logo thương hiệu (Google, Microsoft…) | `<svg>` inline (logo gốc) | Lucide đã bỏ brand logos |
| Đồ hoạ dữ liệu (progress ring, chart, gradient) | `<svg>`/thư viện chart | Không phải "icon" |
| Chữ/số trong nội dung (vd "B. int") | text thường | Là dữ liệu, không phải icon |

### A.3 Màu sắc & Dark mode
- Dùng **biến CSS** (`--text-primary`, `--text-secondary`, `--bg-glass`, `--bg-glass-heavy`,
  `--border-subtle`…) và thang `brand-*` của Tailwind. **Không hardcode hex** trừ token đã
  định nghĩa trong design-system.
- Dark mode qua class `dark` trên `<html>`; mọi màu phải có biến thể `dark:` khi cần.

### A.4 Component dùng lại
Ưu tiên dùng component có sẵn, **không dựng lại**: `GlassCard`, `Button`, `Modal`,
`ThemeToggle` (`src/components/ui/`). Spacing / radius / typography / animation theo
design-system (vd class `page-enter`).

### A.5 Accessibility
- `<img>` phải có `alt`; `<video>/<audio>` phải có `aria-label` + `controls`.
- Dùng `role`/`aria-*` đúng (vd nhóm chọn 1 đáp án dùng `role="radiogroup"`).

---

## PHẦN B — Quy ước lập trình Frontend

### B.1 Stack & tài liệu
- **Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS.**
- ⚠️ Bản Next này có **breaking changes** so với trí nhớ thông thường — **đọc
  `node_modules/next/dist/docs/` trước khi dùng API/quy ước Next mới** (xem `AGENTS.md`).

### B.2 Cấu trúc thư mục
```
src/app/        # routes (App Router); group: (auth) (dashboard) (exam) admin invigilator
src/components/ # ui/ · exam/ · layout/ · invigilator/   (component tái sử dụng)
src/context/    # React context (AuthContext…)
src/hooks/      # custom hooks (useAutoSave, useTheme…)
src/services/   # gọi API (api.ts), indexedDb…
```
- Import dùng alias `@/` (vd `@/components/ui/Button`).

### B.3 Server vs Client Component
- Mặc định là **Server Component**. Chỉ thêm `'use client'` khi cần state / effect / event
  handler / browser API. Không lạm dụng `'use client'` ở component thuần hiển thị.

### B.4 TypeScript
- Type props rõ ràng (interface/`type`). Hạn chế `any` (lint cảnh báo) — ngoại lệ: mock
  trong file test.
- `tsc --noEmit` phải **sạch** trước khi commit.

### B.5 Bảo mật
- Khi buộc dùng `dangerouslySetInnerHTML`, **bắt buộc sanitize** bằng `isomorphic-dompurify`
  (`DOMPurify.sanitize(content)`). Không chèn HTML chưa làm sạch.

### B.6 Dữ liệu / API
- Gọi API qua `src/services/`; base URL từ `NEXT_PUBLIC_API_URL`. Không hardcode URL trong
  component.

### B.7 Kiểm thử (theo Bảng 5.1 — CAIRA)
- **Vitest + @testing-library/react**, file `*.test.tsx` đặt cạnh component.
- Chạy: `npx vitest --run` (coverage: `--coverage`, cần `@vitest/coverage-v8`).
- Test **mã hóa kỳ vọng nghiệp vụ đúng**, để FAIL nếu code thiếu — KHÔNG nới lỏng test.
- Mỗi component/US: Happy ≥1, Edge ≥2, Error ≥2 (xem `docs/11-qc-subagent-process.md`).

### B.8 Lint & Quality gate
- `npm run lint` phải **0 error** trước khi commit (warning được phép nhưng hạn chế phát
  sinh thêm). Các rule `react-hooks/set-state-in-effect`, `react-hooks/purity`,
  `no-unsafe-*` hiện ở mức **warn** (scaffold) — code mới nên tránh vi phạm để siết dần.
- Trước khi mở PR: hoàn thành checklist `.github/PULL_REQUEST_TEMPLATE.md` (Phụ lục B).

### B.9 Git
- Branch `feat/PROJ-xxx-…` từ `develop`; commit theo **Conventional Commits**
  (`feat`, `fix`, `style`, `docs`, `chore`, `test`); PR target `develop`.

---

## Checklist nhanh trước khi commit frontend
- [ ] Không có emoji/ký tự làm icon — tất cả icon là `lucide-react` (A.1).
- [ ] Màu dùng biến CSS / `brand-*`, có `dark:` khi cần (A.3).
- [ ] Dùng lại component sẵn có thay vì dựng mới (A.4).
- [ ] `'use client'` chỉ khi thật cần (B.3).
- [ ] `npx tsc --noEmit` sạch, `npm run lint` 0 error (B.4, B.8).
- [ ] Có test cho thay đổi, `npx vitest --run` xanh (B.7).
- [ ] HTML động đã sanitize (B.5).
