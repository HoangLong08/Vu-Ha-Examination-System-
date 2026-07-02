<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Quy ước Frontend bắt buộc

ĐỌC `../docs/12-frontend-guidelines.md` trước khi sửa giao diện. Các quy tắc cứng:

- **Icon: CHỈ `lucide-react`. KHÔNG dùng emoji/ký tự (`✓ ✗ 📘 📐 👤 📝 📤 🔖`…) làm icon.**
  Bảng emoji ở `../docs/09-design-system.md` §6 chỉ để TRA CỨU tên Lucide — không copy emoji vào JSX.
  Ngoại lệ: logo thương hiệu (Google/MS) và đồ hoạ dữ liệu (progress ring/chart) dùng `<svg>`.
- Màu qua biến CSS (`--text-primary`, `--bg-glass`…) + `brand-*`; có biến thể `dark:`.
- Dùng lại `GlassCard`/`Button`/`Modal`/`ThemeToggle`; mặc định Server Component, chỉ `'use client'` khi cần.
- `dangerouslySetInnerHTML` phải sanitize bằng `isomorphic-dompurify`.
- Trước commit: `npx tsc --noEmit` sạch, `npm run lint` 0 error, `npx vitest --run` xanh.
- Test: Vitest + Testing Library, file `*.test.tsx`; không nới lỏng test để cho pass.
