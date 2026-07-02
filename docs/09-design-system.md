# DAU Examination System — Design System

Version 1.0

---

## 1. THEME — Dark Mode / Light Mode

Hệ thống hỗ trợ **2 chế độ giao diện**, chuyển đổi bằng nút toggle trên header.
Mặc định theo `prefers-color-scheme` của trình duyệt.

### Light Mode

| Token | Giá trị | Mô tả |
|-------|---------|-------|
| `--bg-primary` | `#f8fafc` (slate-50) | Nền chính |
| `--bg-secondary` | `#ffffff` | Nền card |
| `--bg-glass` | `rgba(255,255,255,0.65)` | Nền kính mờ |
| `--text-primary` | `#0f172a` (slate-900) | Chữ chính |
| `--text-secondary` | `#64748b` (slate-500) | Chữ phụ |
| `--border` | `rgba(0,0,0,0.08)` | Viền card |
| `--shadow` | `0 8px 32px rgba(0,0,0,0.08)` | Bóng đổ |

### Dark Mode

| Token | Giá trị | Mô tả |
|-------|---------|-------|
| `--bg-primary` | `#0a0f1a` | Nền chính (gần đen xanh) |
| `--bg-secondary` | `#111827` (gray-900) | Nền card |
| `--bg-glass` | `rgba(17,24,39,0.70)` | Nền kính mờ |
| `--text-primary` | `#f1f5f9` (slate-100) | Chữ chính |
| `--text-secondary` | `#94a3b8` (slate-400) | Chữ phụ |
| `--border` | `rgba(255,255,255,0.08)` | Viền card |
| `--shadow` | `0 8px 32px rgba(0,0,0,0.40)` | Bóng đổ |

### Tailwind v4 Implementation

```css
/* frontend/src/app/globals.css */
@import "tailwindcss";

@theme {
  /* Brand Colors */
  --color-brand-50:  #eff6ff;
  --color-brand-100: #dbeafe;
  --color-brand-500: #3b82f6;
  --color-brand-600: #2563eb;
  --color-brand-700: #1d4ed8;

  --color-accent:    #059669;
  --color-warning:   #d97706;
  --color-danger:    #e11d48;
}

/* Light Theme (default) */
:root {
  --bg-primary:    #f8fafc;
  --bg-secondary:  #ffffff;
  --bg-glass:      rgba(255, 255, 255, 0.65);
  --bg-glass-heavy: rgba(255, 255, 255, 0.85);
  --text-primary:  #0f172a;
  --text-secondary: #64748b;
  --border-glass:  rgba(255, 255, 255, 0.18);
  --border-subtle: rgba(0, 0, 0, 0.08);
  --glass-shadow:  0 8px 32px rgba(31, 38, 135, 0.12);
  --glass-blur:    16px;
}

/* Dark Theme */
.dark {
  --bg-primary:    #0a0f1a;
  --bg-secondary:  #111827;
  --bg-glass:      rgba(17, 24, 39, 0.70);
  --bg-glass-heavy: rgba(17, 24, 39, 0.85);
  --text-primary:  #f1f5f9;
  --text-secondary: #94a3b8;
  --border-glass:  rgba(255, 255, 255, 0.08);
  --border-subtle: rgba(255, 255, 255, 0.06);
  --glass-shadow:  0 8px 32px rgba(0, 0, 0, 0.40);
  --glass-blur:    20px;
}
```

---

## 2. GLASSMORPHISM — Phong cách kính mờ (bóng gương)

### Nguyên tắc thiết kế

1. **Backdrop Blur**: Mọi card, modal, sidebar đều dùng `backdrop-filter: blur(16-20px)`
2. **Semi-transparent Background**: Nền trong suốt một phần (`rgba`)
3. **Subtle Border**: Viền trắng mỏng nhẹ tạo hiệu ứng ánh sáng cạnh
4. **Soft Shadow**: Bóng đổ mềm, màu xanh nhạt (light) hoặc đen đậm (dark)
5. **Gradient Overlays**: Gradient nhẹ 2 lớp tạo chiều sâu

### CSS Utility Classes

```css
/* Glass Card — Component chính */
.glass {
  background: var(--bg-glass);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--border-glass);
  border-radius: 16px;
  box-shadow: var(--glass-shadow);
}

/* Glass Card nặng hơn — cho Modal, Dropdown */
.glass-heavy {
  background: var(--bg-glass-heavy);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid var(--border-glass);
  border-radius: 20px;
  box-shadow:
    var(--glass-shadow),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

/* Glass Sidebar */
.glass-sidebar {
  background: var(--bg-glass);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-right: 1px solid var(--border-glass);
}

/* Glass Header / Navbar */
.glass-header {
  background: var(--bg-glass-heavy);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border-glass);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

/* Glass Button */
.glass-btn {
  background: var(--bg-glass);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border-glass);
  border-radius: 12px;
  transition: all 0.2s ease;
}
.glass-btn:hover {
  background: var(--bg-glass-heavy);
  box-shadow: var(--glass-shadow);
  transform: translateY(-1px);
}

/* Gradient Mesh Background — phía sau toàn bộ app */
.gradient-mesh {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
}
.gradient-mesh::before {
  content: '';
  position: absolute;
  width: 600px;
  height: 600px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%);
  top: -200px;
  right: -100px;
  animation: float 20s ease-in-out infinite;
}
.gradient-mesh::after {
  content: '';
  position: absolute;
  width: 500px;
  height: 500px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(5,150,105,0.12) 0%, transparent 70%);
  bottom: -150px;
  left: -100px;
  animation: float 25s ease-in-out infinite reverse;
}
@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.05); }
  66% { transform: translate(-20px, 20px) scale(0.95); }
}
```

---

## 3. COMPONENT DESIGN SPECS

### 3.1. Card — Exam Card (Dashboard)

```
┌───────────────────────────────────────┐  ← glass card
│  📘  Cơ sở lập trình                  │
│  CS101 — Cuối kỳ HK2                  │
│                                        │
│  🕐 60 phút  •  📝 40 câu  •  📊 10đ │
│  📅 15/06/2026 07:00                   │
│                                        │
│  ┌─────────────────────────────────┐   │
│  │     ▶  Vào thi                  │   │  ← gradient button
│  └─────────────────────────────────┘   │
└───────────────────────────────────────┘
```

Styling:
- `background: var(--bg-glass)` + `backdrop-filter: blur(16px)`
- Border: `1px solid var(--border-glass)`
- Hover: `transform: translateY(-4px)` + shadow tăng
- Button: gradient `linear-gradient(135deg, #2563eb, #1d4ed8)` → hover sáng hơn

### 3.2. Exam Player Layout

```
┌────────────────────────────────────────────────────────┐
│  HEADER (glass-header)                                  │
│  Logo  •  Tên bài thi  •  ⏱ 45:23  •  🌙 Dark Toggle  │
├────────────────────────────────┬─────────────────────────┤
│                                │  SIDEBAR (glass)        │
│  QUESTION AREA                 │  ┌─┬─┬─┬─┬─┐           │
│  (glass card, large)           │  │1│2│3│4│5│           │
│                                │  ├─┼─┼─┼─┼─┤           │
│  Câu 1/40                      │  │6│7│8│✓│ │           │
│  ──────────────                │  └─┴─┴─┴─┴─┘           │
│  Nội dung câu hỏi...          │                         │
│                                │  ── Chú thích ──        │
│  ○ Đáp án A                    │  ⬜ Chưa làm            │
│  ● Đáp án B  ← selected       │  🟦 Đã chọn             │
│  ○ Đáp án C                    │  🟡 Đánh dấu            │
│  ○ Đáp án D                    │  ✅ Đã xác nhận          │
│                                │                         │
│  ┌──────┐  ┌──────┐           │  ┌─────────────────┐    │
│  │ ← Trước │ Sau → │           │  │   📤 Nộp bài    │    │
│  └──────┘  └──────┘           │  └─────────────────┘    │
└────────────────────────────────┴─────────────────────────┘
```

### 3.3. Login Page

```
┌──────────────────────────────────────────────────────┐
│  gradient-mesh background (blue + green orbs)         │
│                                                       │
│         ┌─────────────────────────────┐              │
│         │     glass-heavy card        │              │
│         │                             │              │
│         │     🎓 DAU Exam             │              │
│         │     Hệ thống thi trực tuyến │              │
│         │                             │              │
│         │  ┌───────────────────────┐  │              │
│         │  │ 🔵 Đăng nhập Google   │  │              │
│         │  └───────────────────────┘  │              │
│         │  ┌───────────────────────┐  │              │
│         │  │ 🟦 Đăng nhập Microsoft│  │              │
│         │  └───────────────────────┘  │              │
│         │                             │              │
│         │  Đại học Kiến trúc Đà Nẵng  │              │
│         └─────────────────────────────┘              │
│                                                       │
└──────────────────────────────────────────────────────┘
```

---

## 4. TYPOGRAPHY

| Element | Font | Size | Weight |
|---------|------|------|--------|
| Heading 1 | Inter | 32px | 700 (Bold) |
| Heading 2 | Inter | 24px | 600 (Semibold) |
| Heading 3 | Inter | 20px | 600 |
| Body | Inter | 16px | 400 (Regular) |
| Caption | Inter | 14px | 400 |
| Label | Inter | 12px | 500 (Medium) |
| Code | JetBrains Mono | 14px | 400 |
| Timer | JetBrains Mono | 28px | 700 |

Google Fonts import:

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
```

---

## 5. MICRO-ANIMATIONS

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Card hover | `translateY(-4px)` + shadow tăng | 200ms | ease-out |
| Button hover | `translateY(-1px)` + glow | 150ms | ease |
| Page transition | Fade in + slide up 8px | 300ms | ease-out |
| Modal open | Scale 0.95→1 + fade | 200ms | cubic-bezier(0.16,1,0.3,1) |
| Timer warning | Pulse đỏ khi < 5 phút | 1s loop | ease-in-out |
| Tab switch | Slide indicator + fade content | 250ms | ease |
| Toast notification | Slide from top + fade | 300ms | spring |
| Skeleton loading | Shimmer gradient sweep | 1.5s loop | linear |
| Question select | Border glow + scale 1.02 | 150ms | ease |
| Submit button | Gradient shift + shadow pulse | 200ms | ease |

### CSS Keyframes

```css
/* Shimmer Loading */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.skeleton {
  background: linear-gradient(
    90deg,
    var(--bg-glass) 25%,
    var(--border-glass) 50%,
    var(--bg-glass) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 8px;
}

/* Pulse Warning (timer < 5 min) */
@keyframes pulse-danger {
  0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(225, 29, 72, 0.4); }
  50% { opacity: 0.8; box-shadow: 0 0 20px 4px rgba(225, 29, 72, 0.2); }
}
.timer-warning {
  animation: pulse-danger 1s ease-in-out infinite;
  color: var(--color-danger);
}

/* Glow Button */
@keyframes glow {
  0%, 100% { box-shadow: 0 0 5px rgba(37, 99, 235, 0.3); }
  50% { box-shadow: 0 0 20px rgba(37, 99, 235, 0.5); }
}

/* Page Enter */
@keyframes page-enter {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.page-enter {
  animation: page-enter 300ms ease-out;
}
```

---

## 6. ICON SYSTEM — Lucide React

| Ngữ cảnh | Icon | Tên Lucide |
|-----------|------|------------|
| Dashboard | 📊 | `LayoutDashboard` |
| Bài thi | 📝 | `FileText` |
| Đồng hồ | ⏱ | `Clock` |
| Câu hỏi | ❓ | `HelpCircle` |
| Đánh dấu | 🔖 | `Bookmark` |
| Nộp bài | 📤 | `Send` |
| Cảnh báo | ⚠️ | `AlertTriangle` |
| Thành công | ✅ | `CheckCircle` |
| Dark mode | 🌙 | `Moon` |
| Light mode | ☀️ | `Sun` |
| User | 👤 | `User` |
| Logout | 🚪 | `LogOut` |
| Settings | ⚙️ | `Settings` |
| Fullscreen | 🔲 | `Maximize` |
| Prev/Next | ◀▶ | `ChevronLeft` / `ChevronRight` |

---

## 7. DARK/LIGHT MODE TOGGLE — React Component

```tsx
// frontend/src/components/ui/ThemeToggle.tsx
'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = saved ? saved === 'dark' : prefersDark;
    setDark(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  return (
    <button
      onClick={toggle}
      className="glass-btn p-2.5 rounded-xl transition-all duration-200
                 hover:scale-105 active:scale-95"
      aria-label={dark ? 'Chuyển sang sáng' : 'Chuyển sang tối'}
    >
      {dark ? (
        <Sun className="w-5 h-5 text-amber-400" />
      ) : (
        <Moon className="w-5 h-5 text-slate-600" />
      )}
    </button>
  );
}
```
