# Mục lục tài liệu — DAU Examination System

Thư mục `docs/` là nguồn thông tin đầy đủ về dự án: chỉ cần đọc các file `.md`
dưới đây là đủ hiểu bối cảnh, yêu cầu, kiến trúc, quy ước code và lịch sử QC —
không cần lục lại code hay chat cũ. Bảng dưới đi theo đúng thứ tự số file.

## 1. Nghiệp vụ & yêu cầu (nguồn chân lý)

| File | Mục đích |
|---|---|
| [00-brief.md](00-brief.md) | Brief: vấn đề, mục tiêu, phạm vi, rủi ro, open questions |
| [01-project-vision.md](01-project-vision.md) | Tầm nhìn dự án (rất ngắn, cấp cao) |
| [02-srs.md](02-srs.md) | **SRS kỹ thuật — nguồn chân lý cho mã `FR-A..R`**, được Epic/AC/Traceability tham chiếu trực tiếp |
| [03-use-cases.md](03-use-cases.md) | Catalog 67 Use Case theo 4 vai trò |
| [04-epic-catalog.md](04-epic-catalog.md) | 25 Epic + phân kỳ MVP/Phase 2 |
| [05-user-story.md](05-user-story.md) | 118 User Story theo Epic |
| [06-acceptance-criteria.md](06-acceptance-criteria.md) | **Nguồn chân lý duy nhất cho Acceptance Criteria** (AC-001..038) |
| [16-traceability-matrix.md](16-traceability-matrix.md) | Ma trận truy vết Epic ↔ FR ↔ UC ↔ US ↔ AC ↔ trạng thái code |

## 2. Thiết kế dữ liệu & kiến trúc

| File | Mục đích |
|---|---|
| [07-erd.md](07-erd.md) | ERD — 23 bảng lõi |
| [08-api-contract.md](08-api-contract.md) | API contract (thật + mock), pagination/response format |
| [09-design-system.md](09-design-system.md) | Design system: theme, glassmorphism, typography, animation |
| [29-uml-source-pack.md](29-uml-source-pack.md) | Nguồn PlantUML dùng để render ảnh kiến trúc/use case/sequence/class diagram cho báo cáo (đã gắn nhãn current-state vs target-state) |

## 3. Quy trình & quy ước phát triển

| File | Mục đích |
|---|---|
| [10-role-workflows.md](10-role-workflows.md) | Yêu cầu UI/luồng nghiệp vụ theo từng Role dashboard |
| [11-qc-subagent-process.md](11-qc-subagent-process.md) | Chuẩn vận hành sub-agent QC (test, bug ticket, sign-off) |
| [12-frontend-guidelines.md](12-frontend-guidelines.md) | Quy ước UI + code Frontend bắt buộc (icon, màu, cấu trúc, test) + phụ lục code mẫu (bảo mật phòng thi, auto-save, IP guard) |
| [13-rollback.md](13-rollback.md) | Kế hoạch rollback theo SemVer |

## 4. Lịch sử QC & test (giữ làm tham khảo/audit trail)

| File | Mục đích |
|---|---|
| [14-test-report-wave1.md](14-test-report-wave1.md) | QC Wave 1: backend scaffold, Prisma schema, mock data |
| [15-test-report-wave2-trac-nghiem.md](15-test-report-wave2-trac-nghiem.md) | QC Wave 2: Grading Engine + UI làm bài (kèm tóm tắt PR sign-off) |
| [bugs/backend-bugs.md](bugs/backend-bugs.md) | Bug ticket backend (BUG-BE-xxx), có ghi resolution |
| [bugs/frontend-bugs.md](bugs/frontend-bugs.md) | Bug ticket frontend (BUG-FE-xxx) |

## 5. Tích hợp & vận hành

| File | Mục đích |
|---|---|
| [17-exam-core-integration.md](17-exam-core-integration.md) | Tích hợp nguồn câu hỏi/lịch thật (exam-core, KT&ĐBCL) |
| [18-auth-integration.md](18-auth-integration.md) | Ráp nối đăng nhập với API Auth thật |
| [19-huong-dan-su-dung.md](19-huong-dan-su-dung.md) | Hướng dẫn sử dụng theo 3 vai trò (Sinh viên/Giám thị/Khảo thí) |
| [20-go-live-checklist.md](20-go-live-checklist.md) | Checklist go-live + hướng dẫn triển khai production |

## 6. Use case/sequence UML & báo cáo SRS chính thức

| File | Mục đích |
|---|---|
| [21-usecase-sequence-uml.md](21-usecase-sequence-uml.md) | Nguồn UML use case/sequence current-state + ghi chú review/định hướng tương lai (gộp từ 4 file cũ 21-24) |
| [26-srs-baocao-ieee830.md](26-srs-baocao-ieee830.md) | **SRS bản báo cáo** (văn phong IEEE 830/ISO 29148, mã `FR-AUTH-xx`...) — dùng khi biên soạn báo cáo nộp; **không phải** nguồn chân lý kỹ thuật (xem `02-srs.md`) |

## 7. Ảnh minh họa

| Thư mục | Nội dung |
|---|---|
| [images/architectureDiagram/](images/architectureDiagram/) | Ảnh kiến trúc tổng quan (nguồn: `29-uml-source-pack.md` D01) |
| [images/usecaseDiagram/](images/usecaseDiagram/) | Ảnh use case (nguồn: D02, D04) |
| [images/sequenceDiagram/](images/sequenceDiagram/) | Ảnh sequence (nguồn: D03, D05-D09) |
| [images/classDiagram/](images/classDiagram/) | Ảnh class diagram + ERD (nguồn: D10) |
| [images/huong-dan/](images/huong-dan/) | Ảnh chụp màn hình cho `19-huong-dan-su-dung.md` |

## 8. Ngoại lệ (không phải `.md`, giữ nguyên có chủ đích)

| File | Lý do giữ |
|---|---|
| `index.html` | Trang landing/tổng quan dự án dạng HTML tĩnh (không phải nội dung ngữ cảnh kỹ thuật cho AI, mà là trang giới thiệu có thể mở trực tiếp bằng trình duyệt) |
| `Bao-cao-Phan1-Phan2-DAU-Examination-System (3).docx` | Bài báo cáo Word đã nộp — không chỉnh sửa |

---

> **Ghi chú dọn dẹp (2026-07-07):** đã gộp `21+22+23+24` → `21-usecase-sequence-uml.md`;
> đổi tên `26-software-requirements-specification.md` → `26-srs-baocao-ieee830.md`
> và ghi rõ quan hệ với `02-srs.md`; gộp `skill.md` vào `12-frontend-guidelines.md`;
> gộp `pr-body-exam-grading-qc.md` vào `15-test-report-wave2-trac-nghiem.md`;
> gộp `thietkehethong.txt` vào `29-uml-source-pack.md` (gắn nhãn target-state);
> xóa `30-report-document-map.md` (vai trò nay do chính README này đảm nhiệm),
> `31-baocaoSRS_Agile.md` (file rỗng) và `share/index.html` (bản sao gần như
> trùng `index.html`, không có gì trong repo trỏ tới).
