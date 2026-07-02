# 00. Brief — Phân hệ Thi Trắc nghiệm Trực tuyến (DAU Examination System)

Tài liệu **Phân tích bài toán (Brief)** theo template CAIRA-DAU v1.0 (Mục 4.3). Đây là tầng
chắt lọc *vấn đề + mục tiêu* nằm giữa Tầm nhìn ([01-project-vision](01-project-vision.md)) và
SRS chi tiết ([02-srs](02-srs.md)). Tập trung "**cái gì + tại sao**" (SRS lo "yêu cầu", Feature
Plan lo "làm thế nào").

> ⚠️ Các con số mục tiêu/giả định đánh dấu **(đề xuất)** cần PM/BA chốt. Mục **Open questions**
> phải resolve hết trước khi coi Brief là nguồn chân lý chính thức.

---

## 1. Problem statement — Vấn đề

Trường Đại học Kiến trúc Đà Nẵng (DAU) hiện tổ chức thi học phần chủ yếu theo phương thức
**thủ công trên giấy**: in/sao đề, coi thi đối chiếu danh sách bằng tay, **chấm bài và nhập điểm
thủ công**. Cách làm này gây ra:

- **Tốn công & chậm:** chấm tay + nhập điểm cho hàng nghìn bài/kỳ kéo dài nhiều ngày, dễ sai sót.
- **Khó chuẩn hoá & truy vết:** thiếu nhật ký ai làm gì, khó audit khi có khiếu nại điểm.
- **Rủi ro gian lận & coi thi vất vả:** giám thị khó giám sát đồng thời nhiều thí sinh, khó ghi
  nhận vi phạm có bằng chứng.
- **Dữ liệu phân mảnh:** sinh viên/lịch thi/đề thi nằm rải rác ở UMS, SSO, hệ thống đề — chưa
  có một nơi tổ chức kỳ thi tập trung.

**Bài toán cần giải:** xây dựng một **phân hệ thi trắc nghiệm trên máy tính** (thi tập trung tại
phòng máy của trường và/hoặc trực tuyến) giúp **tổ chức kỳ thi, làm bài, chấm điểm tự động, giám
sát thời gian thực và công bố kết quả** — đồng bộ dữ liệu từ các hệ thống sẵn có qua API, với
**bảo mật phòng thi** và khả năng chịu tải lớn.

## 2. Objectives — Mục tiêu (đo đếm được)

| # | Mục tiêu | Chỉ tiêu (đề xuất) |
|---|---|---|
| O1 | Tự động hoá chấm điểm trắc nghiệm | Chấm xong & có điểm **ngay khi nộp**; loại bỏ 100% thao tác chấm tay cho câu trắc nghiệm |
| O2 | Rút ngắn thời gian có kết quả | Từ *nhiều ngày* → **trong ngày thi** (đề xuất ≤ 1 giờ sau khi đóng ca) |
| O3 | Chịu tải thi tập trung | **≥ 2.000 sinh viên thi đồng thời** (NFR-001), uptime ≥ 99.5% trong ca thi |
| O4 | Chống mất bài khi sự cố mạng | Auto-save 30s + khôi phục 100% bài đang thi sau mất kết nối (FR-H) |
| O5 | Chuẩn hoá & truy vết | Mọi hành vi (đăng nhập, bắt đầu, nộp, vi phạm, đổi cấu hình) đều có **audit log** |
| O6 | Bảo mật phòng thi | Giới hạn dải IP phòng máy + khoá toàn màn hình + ghi nhận vi phạm thời gian thực |

## 3. Target users & Personas

| Vai trò | Bối cảnh | Mục tiêu chính | Nỗi đau hiện tại |
|---|---|---|---|
| **Sinh viên (Student)** | Thi tại phòng máy / trực tuyến, áp lực thời gian | Làm bài mượt, không mất bài, biết điểm sớm | Mất bài khi rớt mạng; chờ điểm lâu |
| **Giám thị (Invigilator)** | Coi 1 phòng nhiều thí sinh | Điểm danh nhanh, giám sát realtime, lập biên bản vi phạm | Đối chiếu tay, khó phát hiện gian lận |
| **Cán bộ khảo thí (Examination Officer)** | Tổ chức kỳ/ca/phòng thi | Tạo kỳ thi, gán phòng/máy, công bố kết quả, xuất báo cáo | Quy trình rời rạc, nhập liệu thủ công |
| **Quản trị (Administrator)** | Vận hành hệ thống | Quản lý người dùng/vai trò, cấu hình, theo dõi hệ thống | — |

## 4. Success criteria — Tiêu chí thành công (có metric)

- **SC1 — Chấm điểm đúng:** sai số chấm tự động = 0 trên bộ đề chuẩn (AC-007); đối soát mẫu ≥ 100 bài khớp tuyệt đối.
- **SC2 — Không mất bài:** ≥ 99,9% phiên thi khôi phục thành công đáp án + thời gian còn lại sau khi mất kết nối (AC-004/005).
- **SC3 — Tải:** vượt bài kiểm tải mô phỏng **2.000 phiên đồng thời**, p95 thời gian lưu đáp án < 500ms *(đề xuất)*.
- **SC4 — Tự động nộp:** 100% bài quá giờ được khoá & nộp tự động (AC-006).
- **SC5 — Giám sát realtime:** trạng thái thí sinh (đang thi/nộp/mất kết nối) cập nhật trên Dashboard giám thị ≤ 2s *(đề xuất)*.
- **SC6 — Báo cáo:** xuất được danh sách dự thi/vắng/vi phạm/biên bản/kết quả (FR-N) đúng định dạng nghiệp vụ.

## 5. Scope — Phạm vi

**Trong phạm vi (in):** Đăng nhập SSO · đồng bộ UMS/Exam Core · quản lý kỳ/ca/phòng thi · điểm
danh · làm bài (single/multiple/true-false, hình ảnh/video/audio) · auto-save & recovery · chấm
điểm tự động (gồm Partial Credit) · giám sát realtime · nộp bài (thủ công & tự động hết giờ) ·
công bố kết quả · báo cáo · audit log · bảo mật phòng máy (giới hạn IP, fullscreen lock, chống
gian lận, SEB).

**Ngoài phạm vi (out):** Quản lý chương trình đào tạo · học phần · **ngân hàng câu hỏi gốc** · đề
cương · LMS. (Dữ liệu sinh viên/đề/lịch lấy từ hệ thống ngoài qua API.)

**Phân kỳ (đề xuất — chờ PM/BA chốt):**
- **V1 (MVP):** SSO, lịch thi, làm bài (single/multiple/true-false + hình ảnh), auto-save/recovery,
  chấm tự động, nộp thủ công + tự động hết giờ, kết quả, giám sát cơ bản, giới hạn IP.
- **V2:** video/audio trong câu hỏi (FR-F-007/008), Safe Exam Browser & chống chuyển-tab nâng cao
  (FR-P-003/004), báo cáo mở rộng, partial-credit cấu hình nâng cao.

## 6. Risks & Assumptions — Rủi ro & Giả định

**Giả định:**
- A1: UMS / SSO / **Exam Core API** sẵn sàng, ổn định và có hợp đồng API rõ ràng *(đang mock cho dev)*.
- A2: Phòng máy có **IP tĩnh** theo dải đã cấu hình; máy thi đủ tương thích trình duyệt.
- A3: Đề & đáp án đúng (gồm `correctAnswer`) do hệ thống đề cung cấp — hệ thống này không soạn đề.

**Rủi ro:**
| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Phụ thuộc API ngoài chưa sẵn sàng | Chặn tích hợp thật | Mock + hợp đồng API sớm; cờ tính năng |
| Đỉnh tải 2.000 phiên đồng thời | Treo/chậm khi thi | Test tải sớm; scale ngang; WebSocket/SSE tối ưu |
| Mất mạng giữa ca thi | Mất bài/khiếu nại | Auto-save 30s + IndexedDB + recovery (FR-H) |
| Gian lận (chuyển tab, đổi chỗ) | Sai lệch kết quả | Fullscreen lock, IP tĩnh, gán số máy, SEB (V2) |
| Đồng hồ hết giờ không chính xác | Nộp sai thời điểm | Đồng hồ server là nguồn chuẩn; cron + cưỡng chế (xem Open Q6) |
| ~~Trùng/lệch tài liệu (AC ở SRS vs 06-acceptance)~~ | Hiểu sai yêu cầu | ✅ Đã xử lý — AC tập trung ở 06 |

## 7. Open questions — Câu hỏi cần PM/BA chốt (resolve trước khi publish)

- **Q1 — Phạm vi V1:** Video/Audio (FR-F-007/008), SEB & chống chuyển-tab (FR-P-003/004) thuộc V1 hay V2?
- **Q2 — Phụ thuộc ngoài:** Exam Core API/UMS/SSO đã sẵn sàng & có spec chính thức chưa?
- **Q3 — Quy mô:** 2.000 đồng thời là đỉnh hay trung bình? Số câu/đề điển hình? Cửa sổ thi cao điểm?
- **Q4 — Partial Credit:** cấu hình ở cấp **đề** hay cấp **câu**? Công thức điểm từng phần chuẩn của trường?
- **Q5 — Mất kết nối:** chính sách bù giờ/gia hạn khi thí sinh rớt mạng?
- **Q6 — Hết giờ:** chấp nhận cron mỗi phút, hay bắt buộc cưỡng chế nộp theo đồng hồ server từng giây?
- **Q7 — Nguồn chân lý AC:** ✅ **ĐÃ CHỐT** — AC tập trung tại [06-acceptance-criteria](06-acceptance-criteria.md) (nguồn chân lý duy nhất), đã gỡ khỏi SRS + sửa số Epic khớp [04](04-epic-catalog.md).

## 8. Truy vết — Bài toán → Tài liệu liên quan

| Khối nghiệp vụ | SRS Module | Epic / User Story | Trạng thái code |
|---|---|---|---|
| Làm bài (loại câu hỏi) | F | EPIC-11 (US-047..053) | ✅ hình ảnh/video/audio (FE) |
| Auto-save & recovery | H | US-059..065 *(theo 05-user-story)* | ⚠️ một phần |
| Nộp bài (thủ công/hết giờ) | J | US-054, US-074, US-075 | ✅ |
| Chấm điểm tự động | K | EPIC-17 (US-076..079) | ✅ gồm Partial Credit |
| Kết quả | L | EPIC-18 (US-080+) | ⚠️ một phần |
| Giám sát realtime | I | — | ⏳ chưa làm (WebSocket) |
| Bảo mật phòng máy | P | — | ⚠️ mới có giới hạn IP |

> Chi tiết kiểm thử & trạng thái QC: [15-test-report-wave2-trac-nghiem](15-test-report-wave2-trac-nghiem.md).

---

*Brief v0.1 (draft) — 2026-06-12. Cần PM/BA chốt mục §7 và các con số **(đề xuất)** để nâng lên
bản chính thức và publish lên Docs Host (Mục 3.2 — CAIRA).*
