# 11. Chuẩn vận hành Sub-agent QC (CAIRA-DAU)

Tài liệu này chuẩn hóa cách các **sub-agent QC** (Claude Code) làm việc, để output luôn tuân theo
"Quy trình phát triển phần mềm CAIRA-DAU v1.0" — đặc biệt Chương 5 (Bước 4, 7), Chương 7 (QC) và
Chương 8 (Quality gates). Mọi lần dùng sub-agent để test/QC phần mềm trắc nghiệm đều phải theo chuẩn này.

> Triết lý (Mục 2.3): **AI là đòn bẩy, không phải auto-pilot.** Sub-agent sinh draft test/bug; Engineer/Tech
> Lead review trước khi đi tiếp. Không "copy mù" output của sub-agent.

---

## 14.1 Phân vai sub-agent

| Vai | Trách nhiệm | Output |
|---|---|---|
| QC Officer (1 sub / domain) | Viết test nghiệp vụ + bug ticket cho 1 mảng (mỗi mảng 1 file riêng, tránh xung đột) | spec file + `docs/bugs/<domain>-bugs.md` |
| Tech Lead (vòng tổng hợp) | Gộp báo cáo, ra QC verdict, quyết sign-off | `docs/test-report-*.md` |

Chia domain để **không ghi đè file của nhau**: mỗi sub-agent sở hữu spec file + bug file riêng.

---

## 14.2 Quy tắc viết test (Bước 4 + Bảng 5.1)

Mỗi User Story **bắt buộc** tối thiểu:

| Loại | Tối thiểu | Ghi chú |
|---|---|---|
| Happy path | ≥ 1 | Luồng chính thành công |
| Edge cases | ≥ 2 | boundary, empty, null, max/min |
| Error cases | ≥ 2 | invalid input, unauthorized, conflict |
| Integration | ≥ 1 | khi có tích hợp service khác / luồng đầu-cuối |

Quy tắc:
- Test **mã hóa kỳ vọng nghiệp vụ ĐÚNG**. Nếu code sai/thiếu → để test FAIL và báo bug; **không nới lỏng** test để ép pass.
- Test lưu trong repo (cạnh source theo convention NestJS / `*.test.tsx` cho FE), **không** lưu trên Drive.
- Backend mock `PrismaService`; Frontend dùng Vitest + Testing Library (jsdom).

## 14.3 Bar chất lượng trước commit (Bước 7 + Bảng 6.2)

- Tất cả unit test pass (trừ test probe lỗ hổng đã ghi nhận trong bug ticket).
- **Coverage ≥ 80% cho code mới.**
- Lint + type-check sạch, không warning.

---

## 14.4 Bug ticket chuẩn (Mục 7.4)

Mỗi bug trong `docs/bugs/<domain>-bugs.md` phải đủ các trường:

- **Tiêu đề** — prefix `[BUG]`, mô tả ngắn triệu chứng.
- **Mã** — `BUG-<BE|FE>-NNN`.
- **Environment** — Local / QA / staging / production.
- **Severity** — Critical / High / Medium / Low (xem 14.5).
- **Linked User Story** — `US-xxx` (truy ngược về `docs/05-user-story.md`).
- **Build / commit hash** — để truy vết nguồn.
- **Steps to reproduce** — chi tiết, ưu tiên trỏ lệnh test cụ thể.
- **Expected vs Actual behavior.**
- **Attachments** — file test / log chứng minh.

## 14.5 Phân loại Severity (Mục 7.5)

| Mức | SLA | Định nghĩa |
|---|---|---|
| Critical | <4h | Blocker, mất data, hoặc lỗ hổng bảo mật |
| High | <24h | Ảnh hưởng nghiêm trọng luồng chính, không có workaround |
| Medium | <1 sprint | Luồng phụ lỗi, có workaround, UX kém |
| Low | Backlog | Cosmetic, typo, UI minor |

---

## 14.6 Báo cáo & tiêu chí sign-off (Mục 7.6, 7.7)

Sub-agent trả về Tech Lead báo cáo súc tích: file đã tạo, số test pass/fail, bug theo severity, ma trận
tuân thủ Bảng 5.1, vùng chưa cover + lý do. Tech Lead tổng hợp thành **QC Test Report** và chỉ
**sign-off** (promote develop → staging) khi:

1. 100% test case đã execute (pass hoặc đã có bug ticket).
2. **Không còn bug Critical/High ở trạng thái Open.**
3. Regression suite pass toàn bộ.
4. Có QC Test Report nêu rõ: số pass/fail, bug list (severity), vùng chưa cover + lý do.

---

## 14.7 Template prompt khởi tạo sub-agent QC

```
Bạn là QC Officer CAIRA-DAU cho domain <X> tại <repo>. Tuân thủ docs/11-qc-subagent-process.md.
- Viết test nghiệp vụ theo Bảng 5.1 (Happy≥1, Edge≥2, Error≥2, Integration≥1) cho <US liên quan>.
- KHÔNG sửa code nghiệp vụ; test mã hóa kỳ vọng đúng, để FAIL nếu code thiếu.
- Sở hữu file riêng: <spec file> và docs/bugs/<domain>-bugs.md (tránh xung đột với sub khác).
- Bug ticket theo template Mục 7.4 + severity Mục 7.5, link US-xxx.
- Trả về báo cáo: file tạo, pass/fail, bug theo severity, ma trận tuân thủ, vùng chưa cover.
```
