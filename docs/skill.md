# skill.md

# DAU Examination System - Developer Skill Guide

Version 1.0

---

## 1. TECHNOLOGY STACK
This project is built using the following stack:
* **Frontend:** Next.js (App Router), Tailwind CSS v4, Lucide React (Icons).
* **Backend:** NestJS, TypeScript.
* **Database:** PostgreSQL.
* **ORM:** Prisma or TypeORM (Recommended: Prisma for schema safety).
* **Real-time:** Socket.io (NestJS Gateways) + Redis (Session/Attempt cache & Pub/Sub).

---

## 2. DIRECTORY STRUCTURE

```text
caira--khaothi-test/
├── docs/                      # Tài liệu dự án
│   ├── 01-project-vision.md
│   ├── 02-srs.md
│   ├── 03-use-cases.md
│   ├── 07-erd.md
│   ├── 08-api-contract.md
│   ├── 04-epic-catalog.md
│   ├── 05-user-story.md
│   ├── 06-acceptance-criteria.md
│   └── skill.md               # File này
├── mock-api/                  # Dữ liệu giả lập
│   ├── exam-definition.json
│   └── questions.json
├── frontend/                  # Next.js Application
│   ├── src/
│   │   ├── app/               # App Router pages
│   │   ├── components/        # Reusable UI components
│   │   ├── hooks/             # Custom React Hooks (useFullscreen, useNetwork)
│   │   ├── services/          # API services (Axios/Fetch configurations)
│   │   └── context/           # React Context (Auth, ExamState)
│   ├── tailwind.config.js
│   └── package.json
└── backend/                   # NestJS Application
    ├── src/
    │   ├── auth/              # Authentication module (SSO, JWT)
    │   ├── exams/             # Exam definitions & player module
    │   ├── attempts/          # Student attempts & auto-save module
    │   ├── rooms/             # Room & Invigilator management module
    │   ├── violations/        # Violation logging & real-time warnings
    │   └── common/            # Guards, Interceptors, Filters, Websockets
    ├── prisma/                # Prisma schemas & migrations
    └── package.json
```

---

## 3. CORE IMPLEMENTATION SKILLS

### 3.1. Browser Lockdown & Tab Block (Next.js Client-side)
To enforce browser lockdown and prevent cheating, implement the following handlers in a React custom hook:

```typescript
// frontend/src/hooks/useExamSecurity.ts
import { useEffect } from 'react';
import axios from 'axios';

export const useExamSecurity = (attemptId: string, isExamActive: boolean) => {
  useEffect(() => {
    if (!isExamActive) return;

    // 1. Chặn F5, Reload, Ctrl+R, F12, Right Click
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Bạn có chắc chắn muốn rời khỏi bài thi? Trạng thái sẽ bị ghi nhận.';
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') || // Inspect element
        (e.ctrlKey && e.key === 'r') || // Ctrl+R
        (e.metaKey && e.key === 'r') // Cmd+R
      ) {
        e.preventDefault();
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // 2. Phát hiện chuyển tab / mất focus (Blur Event)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        logViolation('TAB_SWITCH', 'Sinh viên ẩn trình duyệt hoặc chuyển tab');
      }
    };

    const handleWindowBlur = () => {
      logViolation('WINDOW_BLUR', 'Sinh viên thoát chế độ toàn màn hình hoặc bấm ra ngoài cửa sổ thi');
    };

    const logViolation = async (type: string, description: string) => {
      try {
        await axios.post(`/api/v1/violations`, {
          attemptId,
          type,
          description,
          timestamp: new Date().toISOString()
        });
        // Phát âm thanh cảnh báo tại client
        const audio = new Audio('/assets/warning.mp3');
        audio.play().catch(() => {});
      } catch (err) {
        console.error('Không thể gửi cảnh báo vi phạm:', err);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [attemptId, isExamActive]);
};
```

---

### 3.2. IP Range Filtering Middleware (NestJS Backend-side)
To limit exam access only to university computer lab IP ranges:

```typescript
// backend/src/common/guards/ip-range.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as ipRangeCheck from 'ip-range-check';

@Injectable()
export class IpRangeGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    let clientIp = request.headers['x-forwarded-for'] || request.socket.remoteAddress;

    // Chuẩn hóa IPv6 loopback về IPv4 nếu chạy local
    if (clientIp === '::1' || clientIp === '::ffff:127.0.0.1') {
      clientIp = '127.0.0.1';
    }

    const allowedRanges = this.configService.get<string[]>('ALLOWED_IP_RANGES') || ['127.0.0.1'];

    const isIpAllowed = ipRangeCheck(clientIp, allowedRanges);
    if (!isIpAllowed) {
      throw new ForbiddenException(`Thiết bị thi có IP ${clientIp} không nằm trong dải IP phòng máy được cho phép.`);
    }

    return true;
  }
}
```

---

### 3.3. IndexedDB Client Auto Save (Next.js Client-side)
To implement resilient client-side saving before syncing to the PostgreSQL database:

```typescript
// frontend/src/services/indexedDbService.ts
import Dexie, { type Table } from 'dexie';

export interface LocalAnswer {
  questionId: string;
  answerValue: any;
  timestamp: string;
  isSynced: number; // 0: false, 1: true
}

class ExamDatabase extends Dexie {
  answers!: Table<LocalAnswer>;

  constructor() {
    super('DAU_Exam_LocalDB');
    this.version(1).stores({
      answers: 'questionId, answerValue, timestamp, isSynced'
    });
  }
}

export const localDb = new ExamDatabase();

export const saveAnswerLocally = async (questionId: string, answerValue: any) => {
  await localDb.answers.put({
    questionId,
    answerValue,
    timestamp: new Date().toISOString(),
    isSynced: 0
  });
};
```

---

## 4. DATABASE INDEXING STRATEGY (PostgreSQL)
To support 2,000 concurrent students performing read/write activities:
1. **Index on Foreign Keys:** Ensure all relation fields (`studentId`, `sessionId`, `roomId`, `attemptId`) are indexed.
2. **Composite Index for Attempt Answers:**
   ```sql
   CREATE UNIQUE INDEX idx_attempt_question ON "AttemptAnswer" ("attemptId", "questionId");
   ```
3. **Partitioning:** If the database contains history across multiple years, partition the `AttemptAnswer` and `AuditLog` tables by range of `createdAt`.
4. **Connection Pool Configuration:** Set Pool size to dynamic matching (typically `max_connections = 500` with PgBouncer acting as connection pool manager).
