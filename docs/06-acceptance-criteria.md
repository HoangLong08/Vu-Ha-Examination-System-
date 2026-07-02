# 06. Acceptance Criteria

**Nguồn chân lý DUY NHẤT cho Acceptance Criteria (AC)** của hệ thống (Mục 8.1 — CAIRA).
AC được **gỡ khỏi SRS** ([02-srs](02-srs.md)) để tránh trùng ID/lệch nghĩa; SRS chỉ trỏ về đây.

- Nhóm AC theo **Epic** đúng theo [04-epic-catalog](04-epic-catalog.md) (đã sửa số Epic cho khớp).
- Mỗi User Story khi triển khai phải có AC dạng **Given-When-Then** (Mục 4.6); bản này là mệnh đề
  rút gọn cấp hệ thống, sẽ chi tiết hoá GWT ở từng US ([05-user-story](05-user-story.md)).
- Truy vết AC ↔ Epic ↔ SRS-FR ở cột bên phải.

---

## EPIC-01 — Authentication & SSO
| AC | Tiêu chí | FR |
|----|----------|----|
| AC-001 | Người dùng đăng nhập thành công bằng SSO | FR-A-001 |
| AC-002 | Hệ thống lấy được hồ sơ người dùng (UserId, StudentCode, FullName, Email) | FR-A-002 |
| AC-003 | Vai trò được gán đúng (RBAC) | FR-A-002/003 |

## EPIC-03 — Student Dashboard (Lịch thi & Kết quả)
| AC | Tiêu chí | FR |
|----|----------|----|
| AC-004 | Sinh viên chỉ xem được các kỳ thi được phân công | FR-B-004 |
| AC-005 | Thông tin lịch thi hiển thị chính xác (học phần, ngày, ca, phòng, SBD) | FR-B-002 |

## EPIC-10 / EPIC-11 — Exam Player & Question Rendering
| AC | Tiêu chí | FR |
|----|----------|----|
| AC-006 | Câu Single Choice hoạt động đúng | FR-F-003 |
| AC-007 | Câu Multiple Choice đúng; chấm **All-or-Nothing** hoặc **Partial Credit** theo cấu hình | FR-F-004, FR-G-003 |
| AC-008 | Câu True/False hoạt động đúng | FR-F-005 |
| AC-009 | Hiển thị được hình ảnh trong câu hỏi | FR-F-006 |
| AC-010 | Hiển thị được video *(phân kỳ V2)* | FR-F-007 |
| AC-011 | Phát được âm thanh *(phân kỳ V2)* | FR-F-008 |
| AC-021 | ~~Pre-exam check (trình duyệt, âm thanh, ping mạng) trước khi thi~~ — **ĐÃ BỎ** (vào thi trực tiếp; xem FR-P-001) | FR-P-001 |

## EPIC-13 — Auto Save & Recovery
| AC | Tiêu chí | FR |
|----|----------|----|
| AC-012 | Đáp án được lưu ngay khi sinh viên chọn/đổi | FR-G-001 |
| AC-013 | Auto Save mỗi 30s (đồng bộ server + ghi tạm IndexedDB ở client) | FR-H-001/002 |
| AC-014 | Khôi phục bài + offline sync thành công sau khi có mạng lại, không mất dữ liệu | FR-H-003/004/005 |

## EPIC-16 — Submission Management
| AC | Tiêu chí | FR |
|----|----------|----|
| AC-015 | Nộp bài thủ công thành công (có xác nhận, hiển thị số câu làm/chưa làm) | FR-J-001/002/003 |
| AC-016 | Tự động nộp bài khi hết giờ; khoá chỉnh sửa sau nộp | FR-J-004/005/006 |

## EPIC-17 — Grading Engine
| AC | Tiêu chí | FR |
|----|----------|----|
| AC-017 | Điểm được tính chính xác (tổng điểm, số câu đúng/sai) | FR-K-001..005 |

## EPIC-18 — Result Management
| AC | Tiêu chí | FR |
|----|----------|----|
| AC-018 | Kết quả chấm được lưu chính xác vào CSDL | FR-K-006 |
| AC-026 | Kết quả hiển thị cho SV **NGAY sau khi nộp** nếu đề bật cấu hình `showResult`; nếu **tắt** thì chỉ hiện thông báo "đã hoàn thành" (giấu điểm/đáp án). Khảo thí/Admin xem được mọi lúc | FR-L-001/003 |
| AC-028 | Sinh viên xem được lịch sử thi | FR-L-005 |

## EPIC-07 — Student Assignment
| AC | Tiêu chí | FR |
|----|----------|----|
| AC-022 | Gán/cập nhật số máy phòng máy cho SV thành công; sơ đồ phòng cập nhật tương ứng | FR-P-002 |

## EPIC-14 / EPIC-15 — Monitoring & Invigilator Dashboard
| AC | Tiêu chí | FR |
|----|----------|----|
| AC-019 | Hiển thị trạng thái sinh viên realtime qua WebSocket/SSE | FR-I-003/004 |
| AC-020 | Cảnh báo mất kết nối & vi phạm hiển thị tức thời trên dashboard | FR-I-007/008, FR-P-005 |

## EPIC-09 — Attendance Management
| AC | Tiêu chí | FR |
|----|----------|----|
| AC-029 | Điểm danh đúng trạng thái (Present/Absent/Late/Violation); SV vắng bị khoá vào thi; lưu thời gian + người điểm danh | FR-E-001..005 |

## EPIC-19 — Violation Management
| AC | Tiêu chí | FR |
|----|----------|----|
| AC-030 | Ghi nhận vi phạm (loại, mô tả, thời gian, người lập, số máy) + đính kèm minh chứng; lưu lịch sử | FR-M-001..004 |

## EPIC-20 — Reporting & Statistics
| AC | Tiêu chí | FR |
|----|----------|----|
| AC-027 | Xuất thành công: danh sách dự thi, vắng thi, vi phạm, biên bản phòng thi, báo cáo kết quả theo học phần/kỳ thi | FR-N-001..006 |

## EPIC-22 — Audit Logging
| AC | Tiêu chí | FR |
|----|----------|----|
| AC-031 | Ghi log: đăng nhập, bắt đầu thi, nộp bài, đổi cấu hình, vi phạm (kèm client IP, user agent) | FR-O-001..005 |

## EPIC-25 — Browser Lockdown & Lab Security
| AC | Tiêu chí | FR |
|----|----------|----|
| AC-023 | Bắt buộc & khoá toàn màn hình (Fullscreen Lock) khi làm bài; không tự thoát nếu giám thị chưa xác nhận | FR-P-003 |
| AC-024 | Phát hiện chuyển tab/đổi ứng dụng → khoá bài tạm + ghi biên bản vi phạm | FR-P-004 |
| AC-025 | Chặn đăng nhập/làm bài nếu IP máy trạm ngoài dải IP phòng máy được cấu hình | FR-P-006 |

## EPIC-24 — Exam Configuration
| AC | Tiêu chí | FR |
|----|----------|----|
| AC-032 | Cấu hình trộn câu hỏi/đáp án (Shuffle) và **Max Attempt**; hệ thống chặn khi vượt số lần thi cho phép; hiện/ẩn kết quả-đáp án-giải thích đúng cấu hình | FR-Q-001..004 |

## EPIC-02 — User & Role Management
| AC | Tiêu chí | FR |
|----|----------|----|
| AC-033 | Quản trị quản lý người dùng (tạo/sửa/**vô hiệu hoá**), vai trò & quyền; gán/thu hồi vai trò; người dùng bị vô hiệu hoá không đăng nhập được | FR-R-001..005 |

---

## AC bản nháp (draft — chờ PM/BA chốt nghiệp vụ chi tiết)
| AC | Epic | Tiêu chí (draft) | FR |
|----|------|------------------|----|
| AC-034 | EPIC-04 Exam Management | Khảo thí tạo/sửa **kỳ thi & đợt thi**; trạng thái kỳ thi (chưa mở/đang mở/kết thúc) hiển thị đúng | FR-C-001/002, FR-B-003 |
| AC-035 | EPIC-05 Exam Session | Khảo thí **tạo/mở/đóng/gia hạn ca thi** đúng quy tắc; cấu hình ngày/giờ hợp lệ | FR-C-003..007 |
| AC-036 | EPIC-06 Exam Room | Quản lý phòng (mã/tên/sức chứa); gán danh sách SV & giám thị; hiển thị sơ đồ phòng | FR-D-001..005 |
| AC-037 | EPIC-08 Invigilator Assignment | Gán/đổi **giám thị cho phòng thi**; mỗi phòng có ≥1 giám thị | FR-D-004 |
| AC-038 | EPIC-23 System Configuration | Cấu hình hệ thống: exam settings, **dải IP phòng máy**, integration (SSO/UMS/ExamCore) | FR-P-006 |

> Tổng AC hiện tại: **38** (AC-001..038). Các AC-034..038 ở dạng draft, nâng chính thức sau khi PM/BA xác nhận.

## Ghi chú thay đổi (consolidation)
- Gộp AC từ SRS §"Acceptance Criteria" (cũ AC-001..010) vào đây; **bỏ ID trùng/lệch nghĩa**.
- Sửa số Epic cho khớp [04-epic-catalog](04-epic-catalog.md).
- Bổ sung AC còn thiếu: AC-026 (công bố kết quả), AC-027 (báo cáo), AC-028 (lịch sử thi),
  AC-029 (điểm danh), AC-030 (vi phạm), AC-031 (audit log).
- Đánh dấu V2: AC-010 (video), AC-011 (audio).
