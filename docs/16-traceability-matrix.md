# 16. Ma trận truy vết (Traceability Matrix)

Bảng truy vết **end-to-end** đảm bảo mọi yêu cầu đều liên kết được từ Epic → SRS-FR → Use Case →
User Story → Acceptance Criteria, và đối chiếu trạng thái code (Mục 1 — CAIRA: end-to-end traceability).

- **Nguồn:** [04-epic-catalog](04-epic-catalog.md), [02-srs](02-srs.md), [03-use-cases](03-use-cases.md),
  [05-user-story](05-user-story.md), [06-acceptance-criteria](06-acceptance-criteria.md).
- **Trạng thái code:** ✅ đã làm · ⚠️ một phần/mock · ⏳ chưa làm.
- **Phase:** theo Epic Priority của [04](04-epic-catalog.md) (P1 = EPIC-01→18, P2 = EPIC-19→25);
  ⚠️ điểm lệch với Brief đánh dấu ở ghi chú.

| Epic | SRS Module/FR | Use Case (UC) | User Story | AC | Phase | Code |
|------|---------------|---------------|------------|----|-------|------|
| 01 Authentication & SSO | A (FR-A) | UC-001, 022 | US-001..004 | AC-001..003 | P1 | ✅ |
| 02 User & Role Mgmt | **R (FR-R)** | UC-050,051,052 | US-005..008 | AC-033 | P1 | ⏳ |
| 03 Student Dashboard | B (FR-B) | UC-002,003,004,020,021 | US-009..013 | AC-004,005 | P1 | ⚠️ mock |
| 04 Exam Management | C (FR-C-001/002) | UC-036,037 | US-014..018 | — *(cần AC)* | P1 | ⏳ |
| 05 Exam Session Mgmt | C (FR-C-003..007) | UC-038,042,043,044 | US-019..023 | — *(cần AC)* | P1 | ⏳ |
| 06 Exam Room Mgmt | D (FR-D) | UC-023,040 | US-024..027 | — *(cần AC)* | P1 | ⏳ |
| 07 Student Assignment | P (FR-P-002) | UC-026,040 | US-028..031 | AC-022 | P1 | ⏳ |
| 08 Invigilator Assignment | D (FR-D-004) | UC-041 | US-032..034 | — | P1 | ⏳ |
| 09 Attendance Mgmt | E (FR-E) | UC-025,027,028 | US-035..039 | AC-029 | P1 | ⏳ |
| 10 Exam Player | F (FR-F-001/002/009..013) | UC-006,013,014,015 | US-040..046 | AC-021 | P1 | ✅ (nối API thật; **đã bỏ pre-exam check** — vào thi trực tiếp) |
| 11 Question Rendering | F (FR-F-003..008) | UC-007..012 | US-047..054 | AC-006..011 | P1 *(video/audio→V2)* | ✅ |
| 12 Answer Management | G (FR-G) | UC-007,008,009 | US-055..058 | AC-012 | P1 | ✅ BE |
| 13 Auto Save & Recovery | H (FR-H) | UC-016,017,062,063 | US-059..061 | AC-013,014 | P1 | ✅ (recovery cross-máy + offline sync) |
| 14 Session Monitoring | I (FR-I-003/004) | UC-029,030 | US-062..064 | AC-019 | P1 | ⏳ WebSocket |
| 15 Invigilator Dashboard | I (FR-I) | UC-024,029,031 | US-065..072 | AC-019,020 | P1 | ⚠️ stub |
| 16 Submission Mgmt | J (FR-J) | UC-018,019 | US-073..075 | AC-015,016 | P1 | ✅ |
| 17 Grading Engine | K (FR-K) + G-003 | — *(tự động)* | US-076..079 | AC-007,017 | P1 | ✅ |
| 18 Result Management | L (FR-L) | UC-020,021,046,047 | US-080..085 | AC-018,026,028 | P1 | ✅ (review UI thật + showResult + publish) |
| 19 Violation Mgmt | M (FR-M) | UC-032,033 | US-086..090 | AC-030 | P2 | ⚠️ stub |
| 20 Reporting & Statistics | N (FR-N) | UC-034,035,048,049 | US-091..097 | AC-027 | P2 | ⏳ |
| 21 API Integration | (SSO/UMS/ExamCore) | UC-053..055,058..061,064 | US-098..103 | — | P2 | ⏳ mock |
| 22 Audit Logging | O (FR-O) | UC-056 | US-104..108 | AC-031 | P2 | ⏳ |
| 23 System Configuration | P (FR-P-006) | UC-053,054,055,057 | US-109..111 | — *(cần AC)* | P2 | ⏳ |
| 24 Exam Configuration | **Q (FR-Q)** + L-003/004 | UC-039,045,047 | US-112..115 | AC-032 | P2 | ✅ BE (showResult, maxAttempt, shuffle câu/đáp án) |
| 25 Browser Lockdown & Lab | P (FR-P-001/003/004/005/006) | UC-005,066,067 | US-116..118 | AC-021,023,024,025 | P2 | ⚠️ chỉ IP |

> **Bao phủ:** 25 Epic · 18 SRS module (A–R) · 67 Use Case · 118 User Story · 33 AC.

## Khoảng trống truy vết cần xử lý
1. ~~Thiếu AC cho Epic 04, 05, 06, 08, 23~~ → ✅ đã thêm **AC-034..038 (draft)** trong [06](06-acceptance-criteria.md); chờ PM/BA chốt chi tiết.
2. **Lệch phân kỳ:** EPIC-11 (Question Rendering) ở **P1** theo 04, nhưng **video/audio** (FR-F-007/008, AC-010/011)
   Brief đề xuất đẩy **V2** → cần đồng bộ 04 ↔ Brief.
3. **Độ ưu tiên FR (MoSCoW)** chưa gắn — đề xuất bổ sung cột Must/Should/Could ở SRS (cần PM).
4. **EPIC-08 Invigilator Assignment** chưa có AC và FR riêng (chỉ tựa FR-D-004) — cân nhắc tách FR rõ.

## Trạng thái code (tóm tắt) — cập nhật

**Luồng thi trắc nghiệm chạy thật end-to-end** (đã verify trên Docker):
- ✅ **Đã làm:** Exam Player nối API thật + **Pre-exam check** (10), Question Rendering (11),
  Answer save/autosave (12), **Auto Save & Recovery cross-máy** (13), Submission + auto-submit (16),
  Grading Engine + Partial Credit (17), **Result UI thật + showResult + publish** (18),
  **Exam Config: showResult/maxAttempt/shuffle** (24 — BE).
- ⚠️ **Một phần:** Student/Invigilator Dashboard (03/15) mock, Violation (19) stub,
  Browser security (25): có khóa fullscreen/phát hiện chuyển-tab (FE) + giới hạn IP (BE), **chưa SEB**.
- ⏳ **Chưa làm:** User/Role (02), Exam/Session/Room/Assignment/Attendance (04–09),
  Monitoring WebSocket (14), Reporting (20), **API integration thật** (21 — đang mock-api), Audit (22),
  System Config (23). Video/audio câu hỏi (FR-F-007/008) → V2.

> Chi tiết QC phần đã làm: [15-test-report-wave2-trac-nghiem](15-test-report-wave2-trac-nghiem.md).
