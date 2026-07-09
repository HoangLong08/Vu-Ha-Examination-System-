# SOFTWARE REQUIREMENTS SPECIFICATION

# DAU EXAMINATION SYSTEM

Phiên bản: 1.0  
Chuẩn tham chiếu: IEEE 830 / ISO 29148  
Ngôn ngữ: Tiếng Việt

---

## 1. Giới thiệu

### 1.1. Mục đích

Tài liệu này đặc tả các yêu cầu phần mềm cho hệ thống `DAU Examination System`, là phân hệ tổ chức thi trắc nghiệm trực tuyến/trên máy tính phục vụ công tác khảo thí của Trường Đại học Kiến trúc Đà Nẵng.

Mục tiêu của tài liệu là:
- Xác định rõ phạm vi nghiệp vụ và ranh giới hệ thống.
- Mô tả các yêu cầu chức năng và phi chức năng mà hệ thống phải đáp ứng.
- Làm cơ sở thống nhất giữa các bên liên quan như nghiệp vụ, phát triển, kiểm thử và triển khai.
- Cung cấp nền tảng cho thiết kế chi tiết, kiểm thử nghiệm thu và bảo trì hệ thống.

### 1.2. Phạm vi dự án

Hệ thống cho phép:
- Xác thực người dùng qua cơ chế SSO.
- Đồng bộ dữ liệu sinh viên, lịch thi và đề thi từ các hệ thống bên ngoài.
- Tổ chức kỳ thi, ca thi, phòng thi và phân công giám thị.
- Cho phép sinh viên tham gia làm bài thi trắc nghiệm trên máy tính.
- Tự động lưu bài, khôi phục bài khi gián đoạn và nộp bài thủ công hoặc tự động.
- Chấm điểm tự động đối với các câu hỏi phù hợp và hỗ trợ chấm tay cho câu hỏi tự luận.
- Giám sát quá trình thi, ghi nhận vi phạm, công bố kết quả và xuất báo cáo.

Hệ thống không bao gồm:
- Quản lý chương trình đào tạo.
- Quản lý học phần ở mức tổng thể.
- Quản lý ngân hàng câu hỏi gốc như một hệ độc lập.
- Quản lý LMS hoặc hoạt động dạy học trực tuyến ngoài phạm vi khảo thí.

### 1.3. Vấn đề cần giải quyết

Mô hình thi thủ công hiện tại gây ra các vấn đề chính:
- Chấm bài chậm và dễ sai sót khi xử lý số lượng lớn bài thi.
- Khó kiểm soát và truy vết khi có khiếu nại hoặc sự cố.
- Khó giám sát tập trung nhiều thí sinh trong cùng một ca thi.
- Dữ liệu khảo thí bị phân tán giữa nhiều hệ thống.

Hệ thống được xây dựng để giải quyết các vấn đề trên bằng cách tập trung hóa quy trình khảo thí, số hóa toàn bộ luồng làm bài và tăng tính kiểm soát, bảo mật, tự động hóa.

### 1.4. Thuật ngữ và viết tắt

| Thuật ngữ | Diễn giải |
|---|---|
| SRS | Software Requirements Specification |
| SSO | Single Sign-On, cơ chế đăng nhập một lần bằng tài khoản trường |
| UMS | University Management System, hệ thống quản lý đào tạo/sinh viên |
| Exam Core API | Hệ thống nguồn cung cấp đề thi, cấu hình đề, câu hỏi |
| Exam Attempt | Lượt làm bài của một sinh viên đối với một đề thi |
| Auto-save | Cơ chế tự động lưu bài định kỳ |
| Recovery | Cơ chế khôi phục trạng thái bài thi sau sự cố |
| Invigilator | Giám thị/cán bộ coi thi |
| Examination Officer | Cán bộ khảo thí |
| RBAC | Role-Based Access Control, phân quyền theo vai trò |
| Audit Log | Nhật ký truy vết thao tác hệ thống |

### 1.5. Tài liệu tham chiếu

Tài liệu này được tổng hợp và chuẩn hóa từ các nguồn sau:
- `docs/00-brief.md`
- `docs/02-srs.md`
- `docs/03-use-cases.md`
- `docs/04-epic-catalog.md`
- `docs/05-user-story.md`
- `docs/07-erd.md`
- `docs/08-api-contract.md`
- `docs/21-usecase-sequence-uml.md`
- `docs/29-uml-source-pack.md`
- Cấu trúc mã nguồn tại `backend/` và `frontend/`

> **Quan hệ với `docs/02-srs.md`:** đây là **bản SRS diễn giải lại theo văn
> phong báo cáo chính thức** (chuẩn IEEE 830/ISO 29148, dùng mã `FR-AUTH-xx`,
> `FR-ADMIN-xx`...), phục vụ biên soạn báo cáo/nộp bài. **`docs/02-srs.md` vẫn
> là nguồn chân lý kỹ thuật** cho mã yêu cầu `FR-A..R` mà
> [04-epic-catalog](04-epic-catalog.md), [06-acceptance-criteria](06-acceptance-criteria.md)
> và [16-traceability-matrix](16-traceability-matrix.md) đang tham chiếu — khi
> cập nhật yêu cầu nghiệp vụ, sửa `02-srs.md` trước rồi đồng bộ lại nội dung ở
> đây, không sửa ngược lại.

---

## 2. Mô tả tổng quan

### 2.1. Bối cảnh hệ thống

`DAU Examination System` là một hệ thống trung gian phục vụ tổ chức thi trên máy tính. Hệ thống không hoạt động độc lập hoàn toàn mà tích hợp với:
- Hệ thống SSO để xác thực người dùng.
- Hệ thống UMS để đồng bộ hồ sơ sinh viên và dữ liệu liên quan.
- Hệ thống Exam Core API để lấy đề thi, cấu hình đề thi và dữ liệu câu hỏi.

Hệ thống cung cấp ba cổng chức năng chính:
- Cổng sinh viên.
- Cổng giám thị.
- Cổng khảo thí và quản trị.

> 📌 **[CHÈN ẢNH TẠI ĐÂY]** 
> - **Loại biểu đồ:** Sơ đồ Kiến trúc tổng quan
> - **File ảnh đề xuất:** `docs/images/architectureDiagram/architecture-overview.png`
> - **Nguồn PlantUML:** `docs/29-uml-source-pack.md` (`D01`)
> - **Mô tả ngắn:** Sơ đồ thể hiện quan hệ giữa các phân hệ nội bộ với các hệ thống bên ngoài như SSO, UMS, Exam Core API, cùng các lớp dữ liệu và dịch vụ chính.

### 2.2. Các nhóm người dùng

#### 2.2.1. Sinh viên

Sinh viên là người trực tiếp đăng nhập, xem lịch thi, tham gia thi, làm bài, nộp bài và tra cứu kết quả.

#### 2.2.2. Giám thị

Giám thị thực hiện các tác vụ điểm danh, theo dõi trạng thái phòng thi, giám sát sinh viên trong quá trình thi và ghi nhận vi phạm.

#### 2.2.3. Cán bộ khảo thí

Cán bộ khảo thí chịu trách nhiệm tổ chức kỳ thi, tạo ca thi, cấu hình đề thi, công bố kết quả, xem báo cáo và xử lý các tình huống nghiệp vụ liên quan đến khảo thí.

#### 2.2.4. Quản trị viên

Quản trị viên quản lý người dùng, vai trò, cấu hình hệ thống, cấu hình tích hợp và kiểm soát vận hành tổng thể.

#### 2.2.5. Hệ thống ngoài

Bao gồm:
- SSO
- UMS
- Exam Core API

### 2.3. Giả định và phụ thuộc

- Tài khoản người dùng được quản lý hợp lệ trên hệ thống SSO.
- Dữ liệu sinh viên và dữ liệu đề thi được cung cấp đúng định dạng từ các hệ thống bên ngoài.
- Phòng máy thi có thể được cấu hình theo dải IP tĩnh để kiểm soát truy cập.
- Đồng hồ hệ thống phía máy chủ là nguồn chuẩn để xác định trạng thái ca thi và thời gian còn lại.

### 2.4. Ràng buộc

- Hệ thống sử dụng giao thức HTTPS và xác thực Bearer JWT.
- Hệ thống áp dụng phân quyền RBAC theo vai trò.
- Dữ liệu khảo thí phải được lưu vết đầy đủ ở mức audit.
- Một số chức năng bảo mật thi như toàn màn hình, phát hiện chuyển tab, giới hạn IP phải hoạt động đồng thời với luồng làm bài.
- Hệ thống cần tương thích với kiến trúc tích hợp API hiện có.

---

## 3. Yêu cầu chức năng

Phần này chuyển hóa các Epic, Use Case và User Story hiện có thành các yêu cầu chức năng được nhóm theo từng phân hệ.

### 3.1. Phân hệ Xác thực và Quản lý phiên

#### Mục tiêu

Cho phép người dùng truy cập hệ thống thông qua SSO, duy trì phiên làm việc và kiểm soát vai trò truy cập.

> 📌 **[CHÈN ẢNH TẠI ĐÂY]** 
> - **Loại biểu đồ:** Sơ đồ Use Case chức năng Đăng nhập và Xác thực
> - **File ảnh đề xuất:** `docs/images/usecaseDiagram/auth-usecase.png`
> - **Nguồn PlantUML:** `docs/29-uml-source-pack.md` (`D02`)
> - **Mô tả ngắn:** Sơ đồ mô tả vai trò Sinh viên và hệ thống SSO trong luồng đăng nhập, xác thực và ghi nhận audit.

> 📌 **[CHÈN ẢNH TẠI ĐÂY]** 
> - **Loại biểu đồ:** Sơ đồ tuần tự chức năng Đăng nhập
> - **File ảnh đề xuất:** `docs/images/sequenceDiagram/auth-login-sequence.png`
> - **Nguồn PlantUML:** `docs/29-uml-source-pack.md` (`D03`)
> - **Mô tả ngắn:** Sơ đồ thể hiện các bước từ giao diện người dùng sang API xác thực, SSO, cơ sở dữ liệu và dịch vụ audit để hoàn tất đăng nhập.

#### Yêu cầu chức năng

- `FR-AUTH-01`: Hệ thống phải cho phép người dùng đăng nhập thông qua cơ chế SSO.
- `FR-AUTH-02`: Sau khi xác thực thành công, hệ thống phải lấy hồ sơ người dùng gồm định danh, email, họ tên, vai trò và trạng thái hoạt động.
- `FR-AUTH-03`: Hệ thống phải tạo mới hoặc cập nhật hồ sơ người dùng cục bộ khi người dùng đăng nhập lần đầu hoặc khi thông tin thay đổi.
- `FR-AUTH-04`: Hệ thống phải cấp access token và refresh token để duy trì phiên làm việc.
- `FR-AUTH-05`: Hệ thống phải cho phép đăng xuất an toàn và hủy phiên truy cập.
- `FR-AUTH-06`: Hệ thống phải từ chối đăng nhập đối với tài khoản bị vô hiệu hóa.
- `FR-AUTH-07`: Hệ thống phải ghi nhận nhật ký đăng nhập gồm thời gian, địa chỉ IP và thông tin thiết bị khi có thể thu thập.

#### Luồng cơ bản

1. Người dùng truy cập màn hình đăng nhập.
2. Hệ thống chuyển yêu cầu xác thực sang cổng SSO hoặc nhận `idToken` từ nhà cung cấp danh tính.
3. SSO xác thực thành công và trả về thông tin người dùng.
4. Hệ thống kiểm tra người dùng cục bộ và cập nhật hồ sơ.
5. Hệ thống xác định vai trò truy cập.
6. Hệ thống cấp token truy cập và chuyển người dùng về giao diện phù hợp.

### 3.2. Phân hệ Quản lý người dùng, vai trò và cấu hình hệ thống

#### Mục tiêu

Quản lý người dùng nội bộ, vai trò, phân quyền và các tham số cấu hình phục vụ vận hành hệ thống.

#### Yêu cầu chức năng

- `FR-ADMIN-01`: Hệ thống phải cho phép quản trị viên xem danh sách người dùng theo phân trang và tiêu chí lọc.
- `FR-ADMIN-02`: Hệ thống phải cho phép tạo mới người dùng nội bộ bằng email và tập vai trò được gán.
- `FR-ADMIN-03`: Hệ thống phải cho phép cập nhật hồ sơ người dùng.
- `FR-ADMIN-04`: Hệ thống phải cho phép vô hiệu hóa hoặc kích hoạt lại người dùng.
- `FR-ADMIN-05`: Hệ thống phải hỗ trợ xóa mềm người dùng thay vì xóa vật lý dữ liệu.
- `FR-ADMIN-06`: Hệ thống phải cho phép xem danh sách vai trò và danh sách quyền.
- `FR-ADMIN-07`: Hệ thống phải cho phép tạo vai trò tùy chỉnh.
- `FR-ADMIN-08`: Hệ thống phải cho phép gán hoặc thu hồi vai trò cho người dùng.
- `FR-ADMIN-09`: Hệ thống phải áp dụng phân quyền theo vai trò trên toàn bộ chức năng.
- `FR-ADMIN-10`: Hệ thống phải cho phép cấu hình thông số kết nối SSO, UMS và Exam Core API.
- `FR-ADMIN-11`: Hệ thống phải cho phép cấu hình dải IP được phép tham gia thi.
- `FR-ADMIN-12`: Hệ thống phải ghi nhận nhật ký đối với mọi thay đổi cấu hình và phân quyền.

### 3.3. Phân hệ Đồng bộ và tích hợp dữ liệu

#### Mục tiêu

Đảm bảo dữ liệu đầu vào cho quá trình khảo thí được cung cấp đầy đủ, kịp thời và nhất quán từ các hệ thống nguồn.

#### Yêu cầu chức năng

- `FR-INT-01`: Hệ thống phải đồng bộ hồ sơ sinh viên từ UMS.
- `FR-INT-02`: Hệ thống phải đồng bộ lịch thi, dữ liệu kỳ thi, ca thi hoặc các thực thể liên quan từ hệ thống nguồn nếu được cấu hình tích hợp.
- `FR-INT-03`: Hệ thống phải lấy đề thi và dữ liệu câu hỏi từ Exam Core API khi sinh viên bắt đầu thi hoặc khi hệ thống chuẩn bị phiên thi.
- `FR-INT-04`: Hệ thống phải lưu snapshot đề thi phục vụ truy vết, chấm điểm và khôi phục.
- `FR-INT-05`: Hệ thống phải hỗ trợ cấu hình nguồn câu hỏi theo ngân hàng câu hỏi hoặc ma trận đề.
- `FR-INT-06`: Hệ thống phải hỗ trợ đẩy kết quả thi về hệ thống nguồn khi có yêu cầu tích hợp.
- `FR-INT-07`: Hệ thống phải ghi log đối với các phiên đồng bộ dữ liệu và các lỗi tích hợp.

### 3.4. Phân hệ Quản lý kỳ thi, ca thi và cấu hình đề thi

#### Mục tiêu

Tổ chức cấu trúc kỳ thi và cấu hình hành vi của đề thi trước khi sinh viên làm bài.

> 📌 **[CHÈN ẢNH TẠI ĐÂY]** 
> - **Loại biểu đồ:** Sơ đồ Use Case tổng quan hệ thống khảo thí
> - **File ảnh đề xuất:** `docs/images/usecaseDiagram/exam-system-usecase-overview.png`
> - **Nguồn PlantUML:** `docs/29-uml-source-pack.md` (`D04`)
> - **Mô tả ngắn:** Sơ đồ mô tả các tác nhân Sinh viên, Giám thị, Khảo thí, Quản trị viên cùng các chức năng chính của hệ thống khảo thí.

> 📌 **[CHÈN ẢNH TẠI ĐÂY]** 
> - **Loại biểu đồ:** Sơ đồ tuần tự chuẩn bị kỳ thi và điểm danh
> - **File ảnh đề xuất:** `docs/images/sequenceDiagram/exam-session-preparation-sequence.png`
> - **Nguồn PlantUML:** `docs/29-uml-source-pack.md` (`D05`)
> - **Mô tả ngắn:** Sơ đồ mô tả các bước khảo thí tạo cấu hình thi, phân công, mở ca thi và giám thị điểm danh thí sinh.

#### Yêu cầu chức năng

- `FR-EXAM-01`: Hệ thống phải cho phép tạo, cập nhật, công bố, đóng và lưu trữ kỳ thi.
- `FR-EXAM-02`: Hệ thống phải cho phép tạo đợt thi và ca thi thuộc một kỳ thi.
- `FR-EXAM-03`: Hệ thống phải cho phép cấu hình ngày thi, giờ bắt đầu, giờ kết thúc và thời lượng ca thi.
- `FR-EXAM-04`: Hệ thống phải cho phép mở ca thi để sinh viên đủ điều kiện bắt đầu làm bài.
- `FR-EXAM-05`: Hệ thống phải cho phép đóng ca thi.
- `FR-EXAM-06`: Hệ thống phải cho phép gia hạn thời gian thi cho ca thi hoặc đối tượng phù hợp theo chính sách nghiệp vụ.
- `FR-EXAM-07`: Hệ thống phải cho phép tạm dừng ca thi nếu nghiệp vụ yêu cầu.
- `FR-EXAM-08`: Hệ thống phải cho phép cấu hình đề thi gồm thời lượng, số câu hỏi, nguồn đề, cách hiển thị kết quả và các tham số chống gian lận liên quan.
- `FR-EXAM-09`: Hệ thống phải cho phép cấu hình `shuffle question`, `shuffle answer`, `max attempt`, `show result`, `show answers`, `show explanation`.
- `FR-EXAM-10`: Hệ thống phải kiểm tra số lần thi tối đa của sinh viên trước khi cho phép bắt đầu lượt thi mới.

#### Luồng cơ bản

1. Cán bộ khảo thí tạo kỳ thi và ca thi.
2. Hệ thống lưu thông tin cấu hình và trạng thái ban đầu.
3. Cán bộ khảo thí cấu hình đề thi và tham số hiển thị kết quả.
4. Cán bộ khảo thí công bố hoặc mở ca thi đúng thời điểm.
5. Hệ thống chuyển trạng thái ca thi để cho phép sinh viên tham gia.

### 3.5. Phân hệ Quản lý phòng thi, phân công sinh viên và giám thị

#### Mục tiêu

Quản lý không gian phòng thi, vị trí sinh viên, số báo danh, số máy thi và giám thị phụ trách.

#### Yêu cầu chức năng

- `FR-ROOM-01`: Hệ thống phải cho phép quản lý danh sách phòng thi.
- `FR-ROOM-02`: Mỗi phòng thi phải có mã phòng, tên phòng, sức chứa và thông tin vị trí khi cần.
- `FR-ROOM-03`: Hệ thống phải cho phép phân công sinh viên vào từng phòng thi.
- `FR-ROOM-04`: Hệ thống phải cho phép gán số báo danh cho sinh viên theo phòng hoặc ca thi.
- `FR-ROOM-05`: Hệ thống phải cho phép gán vị trí ngồi và số máy thi cho sinh viên trong phòng máy.
- `FR-ROOM-06`: Hệ thống phải cho phép điều chuyển sinh viên giữa các phòng thi trong trường hợp cần thiết.
- `FR-ROOM-07`: Hệ thống phải cho phép phân công một hoặc nhiều giám thị cho từng phòng hoặc ca thi.
- `FR-ROOM-08`: Hệ thống phải cho phép thay đổi phân công giám thị.
- `FR-ROOM-09`: Hệ thống phải cung cấp dữ liệu danh sách sinh viên theo ca thi cho giao diện giám thị.

### 3.6. Phân hệ Điểm danh và kiểm soát vào thi

#### Mục tiêu

Xác nhận tư cách dự thi của sinh viên trước khi cho phép truy cập bài thi.

#### Yêu cầu chức năng

- `FR-ATT-01`: Hệ thống phải cho phép giám thị điểm danh sinh viên trong danh sách phòng thi.
- `FR-ATT-02`: Trạng thái điểm danh phải bao gồm tối thiểu `PRESENT`, `ABSENT`, `LATE`, `VIOLATION`.
- `FR-ATT-03`: Hệ thống phải ghi nhận thời gian điểm danh và người thực hiện điểm danh.
- `FR-ATT-04`: Sinh viên bị đánh dấu `ABSENT` không được phép bắt đầu thi.
- `FR-ATT-05`: Hệ thống phải cho phép tổng hợp số lượng có mặt, vắng mặt, đến muộn và vi phạm theo phòng thi.
- `FR-ATT-06`: Hệ thống phải hỗ trợ truy xuất danh sách điểm danh cho báo cáo và biên bản phòng thi.

### 3.7. Phân hệ Cổng sinh viên và lịch thi

#### Mục tiêu

Cung cấp cho sinh viên giao diện tập trung để xem thông tin cá nhân, lịch thi và trạng thái bài thi.

#### Yêu cầu chức năng

- `FR-STU-01`: Sinh viên phải xem được hồ sơ cá nhân cơ bản.
- `FR-STU-02`: Sinh viên phải xem được danh sách bài thi được phân công.
- `FR-STU-03`: Mỗi bài thi hiển thị tối thiểu tên học phần, ngày thi, ca thi, phòng thi, số báo danh và trạng thái.
- `FR-STU-04`: Sinh viên chỉ được xem các bài thi thuộc về mình.
- `FR-STU-05`: Hệ thống phải hiển thị hướng dẫn hoặc quy chế thi đi kèm nếu được cấu hình.

### 3.8. Phân hệ Tham gia thi và trình phát bài thi

#### Mục tiêu

Cho phép sinh viên bắt đầu lượt thi, tải đề thi, hiển thị câu hỏi và thực hiện bài thi.

> 📌 **[CHÈN ẢNH TẠI ĐÂY]** 
> - **Loại biểu đồ:** Sơ đồ tuần tự chức năng Vào thi và lấy đề thi
> - **File ảnh đề xuất:** `docs/images/sequenceDiagram/exam-entry-fetch-sequence.png`
> - **Nguồn PlantUML:** `docs/29-uml-source-pack.md` (`D06`)
> - **Mô tả ngắn:** Sơ đồ mô tả luồng sinh viên bắt đầu thi, hệ thống kiểm tra điều kiện, lấy snapshot đề thi và trả dữ liệu an toàn cho giao diện làm bài.

#### Yêu cầu chức năng

- `FR-PLAYER-01`: Hệ thống chỉ cho phép sinh viên bắt đầu thi khi ca thi đang mở.
- `FR-PLAYER-02`: Hệ thống phải kiểm tra điều kiện vào thi gồm danh sách phân công, trạng thái điểm danh, giới hạn số lần thi và các ràng buộc khác.
- `FR-PLAYER-03`: Hệ thống phải tạo mới hoặc khôi phục `Exam Attempt` khi sinh viên bắt đầu thi.
- `FR-PLAYER-04`: Hệ thống phải lấy snapshot đề thi từ nguồn dữ liệu thích hợp.
- `FR-PLAYER-05`: Hệ thống phải loại bỏ thông tin đáp án đúng trước khi trả dữ liệu câu hỏi cho giao diện sinh viên.
- `FR-PLAYER-06`: Hệ thống phải hiển thị đồng hồ đếm ngược thời gian còn lại.
- `FR-PLAYER-07`: Hệ thống phải hỗ trợ hiển thị câu hỏi dạng `Single Choice`, `Multiple Choice`, `True/False`, `Essay`.
- `FR-PLAYER-08`: Hệ thống phải hỗ trợ hiển thị nội dung media, tối thiểu là hình ảnh; có thể mở rộng video và âm thanh theo cấu hình đề thi và phạm vi triển khai.
- `FR-PLAYER-09`: Hệ thống phải hỗ trợ điều hướng giữa các câu hỏi.
- `FR-PLAYER-10`: Hệ thống phải hỗ trợ đánh dấu câu hỏi cần xem lại.
- `FR-PLAYER-11`: Hệ thống phải hiển thị số câu đã làm và số câu chưa làm.

#### Luồng cơ bản

1. Sinh viên chọn bài thi từ danh sách.
2. Hệ thống kiểm tra quyền vào thi.
3. Hệ thống khởi tạo hoặc khôi phục lượt thi.
4. Hệ thống lấy snapshot đề thi.
5. Hệ thống trả danh sách câu hỏi đã loại bỏ đáp án đúng.
6. Giao diện hiển thị bài thi và bắt đầu bộ đếm thời gian.

### 3.9. Phân hệ Quản lý đáp án, tự động lưu và khôi phục

#### Mục tiêu

Đảm bảo bài làm được lưu bền vững, an toàn trước sự cố mạng hoặc trình duyệt.

> 📌 **[CHÈN ẢNH TẠI ĐÂY]** 
> - **Loại biểu đồ:** Sơ đồ tuần tự chức năng Làm bài, Auto-save và Recovery
> - **File ảnh đề xuất:** `docs/images/sequenceDiagram/exam-autosave-recovery-sequence.png`
> - **Nguồn PlantUML:** `docs/29-uml-source-pack.md` (`D07`)
> - **Mô tả ngắn:** Sơ đồ mô tả luồng lưu đáp án ngay khi chọn, lưu cục bộ ở trình duyệt, đồng bộ định kỳ lên máy chủ và khôi phục khi gián đoạn.

#### Yêu cầu chức năng

- `FR-ANS-01`: Hệ thống phải lưu đáp án ngay khi sinh viên chọn hoặc thay đổi đáp án.
- `FR-ANS-02`: Mỗi bản ghi đáp án phải gắn với mã lượt thi, mã câu hỏi, giá trị đáp án và thời điểm cập nhật.
- `FR-ANS-03`: Đối với câu `Multiple Choice`, hệ thống phải hỗ trợ lưu toàn bộ tập đáp án đã chọn.
- `FR-ANS-04`: Sinh viên được phép thay đổi đáp án trước thời điểm nộp bài.
- `FR-ANS-05`: Sau khi nộp bài, hệ thống không cho phép sửa đáp án.
- `FR-SAVE-01`: Hệ thống phải tự động lưu định kỳ dữ liệu bài làm.
- `FR-SAVE-02`: Chu kỳ tự động lưu mặc định là 30 giây.
- `FR-SAVE-03`: Hệ thống phải lưu trạng thái bài thi ở cả phía máy chủ và vùng lưu trữ cục bộ phía trình duyệt.
- `FR-SAVE-04`: Khi kết nối được khôi phục, hệ thống phải đồng bộ dữ liệu cục bộ lên máy chủ.
- `FR-SAVE-05`: Khi có xung đột dữ liệu, hệ thống phải ưu tiên bản ghi có thời gian cập nhật mới nhất.
- `FR-SAVE-06`: Khi trình duyệt bị đóng hoặc sinh viên đăng nhập lại, hệ thống phải cho phép tiếp tục bài thi đang mở.
- `FR-SAVE-07`: Dữ liệu khôi phục phải bao gồm đáp án đã chọn, thời gian còn lại và trạng thái lượt thi.

#### Luồng cơ bản

1. Sinh viên chọn đáp án.
2. Hệ thống cập nhật trạng thái giao diện.
3. Hệ thống lưu đáp án xuống bộ nhớ cục bộ.
4. Hệ thống gửi dữ liệu đáp án hoặc gói autosave lên máy chủ theo định kỳ.
5. Nếu mất kết nối, dữ liệu chưa đồng bộ vẫn được giữ cục bộ.
6. Khi có mạng lại, hệ thống đồng bộ dữ liệu và khôi phục trạng thái bài thi.

### 3.10. Phân hệ Nộp bài, chấm điểm và công bố kết quả

#### Mục tiêu

Hoàn tất lượt thi, khóa bài làm, chấm điểm và cung cấp kết quả theo cấu hình công bố.

> 📌 **[CHÈN ẢNH TẠI ĐÂY]** 
> - **Loại biểu đồ:** Sơ đồ tuần tự chức năng Nộp bài, Chấm điểm và Xem kết quả
> - **File ảnh đề xuất:** `docs/images/sequenceDiagram/exam-submit-grade-result-sequence.png`
> - **Nguồn PlantUML:** `docs/29-uml-source-pack.md` (`D08`)
> - **Mô tả ngắn:** Sơ đồ mô tả luồng nộp bài thủ công hoặc tự động, khóa đáp án, chấm điểm, lưu kết quả và trả về kết quả hiển thị theo cấu hình đề thi.

#### Yêu cầu chức năng

- `FR-SUB-01`: Hệ thống phải cho phép sinh viên nộp bài thủ công.
- `FR-SUB-02`: Trước khi nộp bài, hệ thống phải hiển thị hộp xác nhận.
- `FR-SUB-03`: Hệ thống phải hiển thị số câu đã làm và chưa làm trước khi xác nhận nộp.
- `FR-SUB-04`: Khi hết thời gian, hệ thống phải tự động nộp bài.
- `FR-SUB-05`: Sau khi nộp bài, trạng thái lượt thi phải chuyển sang `SUBMITTED`.
- `FR-SUB-06`: Sau khi nộp bài, mọi thao tác sửa đáp án phải bị khóa.
- `FR-GRADE-01`: Hệ thống phải chấm điểm tự động cho câu hỏi trắc nghiệm.
- `FR-GRADE-02`: Câu `Single Choice` được chấm theo một đáp án đúng duy nhất.
- `FR-GRADE-03`: Câu `Multiple Choice` được chấm theo cấu hình `All-or-Nothing` hoặc `Partial Credit`.
- `FR-GRADE-04`: Câu `True/False` được chấm theo giá trị đúng/sai.
- `FR-GRADE-05`: Hệ thống phải hỗ trợ chấm tay cho câu hỏi tự luận nếu loại câu hỏi đó được áp dụng.
- `FR-GRADE-06`: Hệ thống phải tính tổng điểm, số câu đúng, số câu sai và lưu kết quả vào cơ sở dữ liệu.
- `FR-RESULT-01`: Hệ thống phải cho phép sinh viên xem kết quả ngay sau khi nộp bài nếu đề thi bật cấu hình hiển thị kết quả.
- `FR-RESULT-02`: Nếu cấu hình không cho hiển thị, hệ thống chỉ hiển thị thông báo hoàn thành bài thi.
- `FR-RESULT-03`: Kết quả phải thể hiện tối thiểu điểm số, số câu đúng, số câu sai và thời gian làm bài.
- `FR-RESULT-04`: Hệ thống phải cho phép cấu hình hiển thị hoặc ẩn đáp án đúng.
- `FR-RESULT-05`: Hệ thống phải cho phép cấu hình hiển thị hoặc ẩn giải thích đáp án.
- `FR-RESULT-06`: Hệ thống phải cho phép khảo thí hoặc quản trị công bố và ẩn kết quả hàng loạt theo đề thi hoặc kỳ thi phù hợp.
- `FR-RESULT-07`: Hệ thống phải cho phép sinh viên xem lịch sử kết quả đã được công bố.

### 3.11. Phân hệ Giám sát phòng thi và hỗ trợ giám thị

#### Mục tiêu

Cung cấp cho giám thị khả năng theo dõi tiến độ làm bài, trạng thái kết nối và các hành vi bất thường trong phòng thi.

> 📌 **[CHÈN ẢNH TẠI ĐÂY]** 
> - **Loại biểu đồ:** Sơ đồ tuần tự chức năng Giám sát phòng thi và cảnh báo sự cố
> - **File ảnh đề xuất:** `docs/images/sequenceDiagram/invigilation-monitoring-sequence.png`
> - **Nguồn PlantUML:** `docs/29-uml-source-pack.md` (`D09`)
> - **Mô tả ngắn:** Sơ đồ mô tả luồng cập nhật trạng thái làm bài, heartbeat, cảnh báo mất kết nối hoặc vi phạm bảo mật từ máy sinh viên đến dashboard giám thị.

#### Yêu cầu chức năng

- `FR-MON-01`: Hệ thống phải hiển thị danh sách sinh viên theo phòng hoặc ca thi cho giám thị.
- `FR-MON-02`: Mỗi sinh viên phải có tối thiểu mã sinh viên, họ tên, số báo danh, số máy thi và trạng thái làm bài khi có dữ liệu.
- `FR-MON-03`: Trạng thái làm bài phải bao gồm ít nhất `NOT_JOINED`, `CONNECTED`, `TAKING_EXAM`, `SUBMITTED`, `DISCONNECTED`.
- `FR-MON-04`: Hệ thống phải hỗ trợ cập nhật trạng thái phòng thi theo thời gian thực.
- `FR-MON-05`: Hệ thống phải hiển thị tổng số sinh viên chưa vào thi, đang thi, đã nộp bài và mất kết nối.
- `FR-MON-06`: Hệ thống phải hiển thị thời gian còn lại của từng sinh viên nếu có dữ liệu lượt thi.
- `FR-MON-07`: Hệ thống phải cảnh báo khi sinh viên mất kết nối hoặc đăng nhập muộn.
- `FR-MON-08`: Hệ thống phải cho phép giám thị thực hiện các thao tác hỗ trợ như đặt lại phiên hoặc hỗ trợ đổi máy theo phân quyền nghiệp vụ.

### 3.12. Phân hệ Quản lý vi phạm và an ninh phòng thi

#### Mục tiêu

Phát hiện, ghi nhận và xử lý các hành vi vi phạm quy chế thi trong môi trường thi trên máy tính.

#### Yêu cầu chức năng

- `FR-SEC-01`: Hệ thống phải hỗ trợ kiểm tra điều kiện thiết bị trước khi thi nếu chức năng này được bật trong từng giai đoạn triển khai.
- `FR-SEC-02`: Hệ thống phải hỗ trợ giới hạn truy cập làm bài theo dải IP được phép.
- `FR-SEC-03`: Hệ thống phải hỗ trợ khóa bài thi ở chế độ toàn màn hình hoặc cơ chế tương đương khi cấu hình bảo mật được bật.
- `FR-SEC-04`: Hệ thống phải phát hiện các hành vi như chuyển tab, mất focus, thoát toàn màn hình hoặc thao tác bất thường khác khi có khả năng kỹ thuật.
- `FR-SEC-05`: Hệ thống phải ghi nhận sự kiện vi phạm từ nguồn tự động hoặc từ giám thị.
- `FR-SEC-06`: Mỗi vi phạm phải ghi nhận loại vi phạm, mô tả, thời gian, người ghi nhận, sinh viên liên quan, phòng thi và số máy thi nếu có.
- `FR-SEC-07`: Hệ thống phải hỗ trợ đính kèm minh chứng cho vi phạm.
- `FR-SEC-08`: Hệ thống phải hỗ trợ lưu lịch sử vi phạm phục vụ xử lý sau kỳ thi.
- `FR-SEC-09`: Hệ thống phải có khả năng tự động cảnh báo cho giám thị khi phát hiện vi phạm theo thời gian thực.
- `FR-SEC-10`: Hệ thống phải có khả năng áp dụng chính sách khóa bài thi khi số lần vi phạm vượt ngưỡng cấu hình, nếu chính sách này được kích hoạt.

### 3.13. Phân hệ Báo cáo và thống kê

#### Mục tiêu

Hỗ trợ cán bộ khảo thí và quản trị tổng hợp dữ liệu kỳ thi, kết quả và vi phạm.

#### Yêu cầu chức năng

- `FR-REP-01`: Hệ thống phải xuất được danh sách dự thi.
- `FR-REP-02`: Hệ thống phải xuất được danh sách vắng thi.
- `FR-REP-03`: Hệ thống phải xuất được danh sách vi phạm.
- `FR-REP-04`: Hệ thống phải xuất được biên bản phòng thi.
- `FR-REP-05`: Hệ thống phải cung cấp báo cáo kết quả theo đề thi, học phần, phòng thi hoặc kỳ thi phù hợp với dữ liệu cấu hình.
- `FR-REP-06`: Hệ thống phải cung cấp thống kê tổng quan như điểm trung bình, tỷ lệ đạt và phổ điểm khi có dữ liệu tương ứng.
- `FR-REP-07`: Hệ thống phải ghi nhận lịch sử sinh báo cáo phục vụ truy vết.

### 3.14. Phân hệ Audit và truy vết

#### Mục tiêu

Đảm bảo mọi thao tác quan trọng đều có thể truy vết phục vụ điều tra sự cố, khiếu nại và kiểm soát vận hành.

#### Yêu cầu chức năng

- `FR-AUD-01`: Hệ thống phải ghi nhật ký đăng nhập.
- `FR-AUD-02`: Hệ thống phải ghi nhật ký bắt đầu thi.
- `FR-AUD-03`: Hệ thống phải ghi nhật ký nộp bài.
- `FR-AUD-04`: Hệ thống phải ghi nhật ký thay đổi cấu hình.
- `FR-AUD-05`: Hệ thống phải ghi nhật ký vi phạm hoặc can thiệp thủ công quan trọng.
- `FR-AUD-06`: Hệ thống phải cho phép vai trò phù hợp tra cứu nhật ký theo người dùng, hành động và thời gian.

---

## 4. Yêu cầu phi chức năng

### 4.1. Hiệu năng

- `NFR-PERF-01`: Hệ thống phải hỗ trợ tối thiểu 2.000 sinh viên đồng thời trong giai đoạn cao điểm thi.
- `NFR-PERF-02`: Thao tác lưu đáp án và autosave phải phản hồi trong khoảng thời gian đủ nhanh để không làm gián đoạn trải nghiệm làm bài.
- `NFR-PERF-03`: Hệ thống phải hỗ trợ cơ chế xử lý đồng thời cho nhiều ca thi và nhiều phòng thi.

### 4.2. Tính sẵn sàng và khả năng phục hồi

- `NFR-AVL-01`: Hệ thống phải đạt mức sẵn sàng tối thiểu 99,5% trong các giai đoạn vận hành chính thức.
- `NFR-AVL-02`: Hệ thống phải có cơ chế giảm thiểu mất dữ liệu bài làm khi xảy ra mất kết nối mạng hoặc sự cố trình duyệt.
- `NFR-AVL-03`: Dữ liệu bài thi phải khôi phục được từ trạng thái autosave gần nhất.

### 4.3. Bảo mật

- `NFR-SEC-01`: Mọi giao tiếp mạng phải sử dụng HTTPS; kết nối thời gian thực phải sử dụng giao thức bảo mật tương đương.
- `NFR-SEC-02`: Hệ thống phải sử dụng xác thực JWT hoặc cơ chế bảo mật phiên tương đương sau bước SSO.
- `NFR-SEC-03`: Hệ thống phải áp dụng phân quyền RBAC cho các API và giao diện.
- `NFR-SEC-04`: Hệ thống phải hỗ trợ giới hạn IP cho môi trường phòng máy.
- `NFR-SEC-05`: Hệ thống phải bảo vệ dữ liệu đề thi, đáp án đúng và kết quả theo đúng vai trò truy cập.
- `NFR-SEC-06`: Hệ thống phải lưu vết đầy đủ cho các hành vi nghiệp vụ quan trọng và sự kiện an ninh.

### 4.4. Khả năng mở rộng

- `NFR-SCALE-01`: Hệ thống phải cho phép mở rộng số lượng phòng thi, số ca thi và số phiên thi đồng thời mà không làm thay đổi logic nghiệp vụ cốt lõi.
- `NFR-SCALE-02`: Kiến trúc phải cho phép tách các dịch vụ theo mô-đun chức năng khi cần.

### 4.5. Tính tương thích

- `NFR-COMP-01`: Giao diện người dùng phải hoạt động trên các trình duyệt hiện đại như Chrome, Edge, Firefox và Safari trong giới hạn hỗ trợ của dự án.
- `NFR-COMP-02`: Hệ thống phải ưu tiên hoạt động ổn định trên máy tính để bàn trong bối cảnh thi phòng máy.

### 4.6. Khả năng sử dụng

- `NFR-USE-01`: Giao diện làm bài phải rõ ràng, dễ thao tác và hiển thị trạng thái lưu bài cho sinh viên.
- `NFR-USE-02`: Giao diện giám thị phải cung cấp thông tin đủ để theo dõi phòng thi theo thời gian thực.
- `NFR-USE-03`: Hệ thống phải giảm tối đa số bước không cần thiết trước khi sinh viên vào thi.

### 4.7. Khả năng bảo trì và kiểm thử

- `NFR-MAINT-01`: Hệ thống phải có cấu trúc mô-đun rõ ràng ở cả backend và frontend.
- `NFR-MAINT-02`: Các API phải có hợp đồng dữ liệu rõ ràng để hỗ trợ kiểm thử tự động.
- `NFR-MAINT-03`: Hệ thống phải cho phép thay đổi cấu hình tích hợp mà không cần sửa trực tiếp mã nguồn nghiệp vụ.

---

## 5. Thiết kế dữ liệu

### 5.1. Tổng quan mô hình dữ liệu

Mô hình dữ liệu của hệ thống được tổ chức theo các nhóm miền chính:
- Người dùng và bảo mật.
- Sinh viên.
- Kỳ thi, ca thi và cấu hình đề thi.
- Phòng thi, phân công và điểm danh.
- Lượt làm bài, câu hỏi, đáp án.
- Kết quả, vi phạm, báo cáo.
- Audit log và cấu hình hệ thống.

> 📌 **[CHÈN ẢNH TẠI ĐÂY]** 
> - **Loại biểu đồ:** Sơ đồ ERD tổng quan
> - **Đường dẫn thư mục tham chiếu:** `docs/07-erd.md`
> - **Mô tả ngắn:** Sơ đồ thể hiện toàn bộ các thực thể dữ liệu chính của hệ thống khảo thí và quan hệ giữa người dùng, sinh viên, kỳ thi, lượt làm bài, kết quả và vi phạm.

> 📌 **[CHÈN ẢNH TẠI ĐÂY]** 
> - **Loại biểu đồ:** Sơ đồ Class Diagram tổng hợp
> - **File ảnh đề xuất:** `docs/images/classDiagram/domain-class-overview.png`
> - **Nguồn PlantUML:** `docs/29-uml-source-pack.md` (`D10`)
> - **Mô tả ngắn:** Sơ đồ mô hình miền dữ liệu và các thực thể nghiệp vụ cốt lõi như ExamAttempt, ExamDefinition, Result, Violation, Attendance và User.

### 5.2. Các thực thể nghiệp vụ chính

#### 5.2.1. User, Role, UserRole

Quản lý định danh nội bộ, vai trò và phân quyền truy cập hệ thống.

#### 5.2.2. Student

Lưu thông tin sinh viên phục vụ phân công thi, làm bài và truy xuất kết quả.

#### 5.2.3. Exam, ExamPeriod, ExamSession, ExamDefinition, SessionExam

Nhóm thực thể dùng để mô tả cấu trúc kỳ thi, đợt thi, ca thi và cấu hình đề thi.

#### 5.2.4. ExamRoom, RoomAssignment, InvigilatorAssignment, Attendance

Nhóm thực thể phục vụ tổ chức phòng thi, phân công sinh viên, phân công giám thị và điểm danh.

#### 5.2.5. ExamAttempt, AttemptQuestion, AttemptAnswer, QuestionSnapshot

Nhóm thực thể trung tâm cho luồng làm bài, lưu snapshot câu hỏi, đáp án và trạng thái bài thi.

#### 5.2.6. Result

Lưu kết quả chấm điểm cuối cùng, trạng thái công bố và thông tin phục vụ tra cứu kết quả.

#### 5.2.7. Violation, ViolationAttachment

Lưu các vi phạm quy chế thi và minh chứng đính kèm.

#### 5.2.8. ReportExport

Lưu thông tin các lần sinh báo cáo.

#### 5.2.9. AuditLog

Lưu nhật ký truy vết các thao tác quan trọng trong hệ thống.

#### 5.2.10. SystemConfig

Lưu tham số cấu hình động của hệ thống.

### 5.3. Ràng buộc dữ liệu mức nghiệp vụ

- Một người dùng có thể mang nhiều vai trò.
- Một sinh viên có thể có nhiều lượt làm bài nhưng bị ràng buộc bởi `max attempt`.
- Một lượt làm bài gắn với một đề thi và có thể gắn với một ca thi cụ thể.
- Một kết quả chỉ thuộc về một lượt làm bài.
- Một sinh viên tại một ca thi chỉ có một trạng thái điểm danh hợp lệ.
- Một vi phạm phải gắn được với sinh viên, ca thi và phòng thi liên quan.

---

## 6. Phụ lục định hướng chèn sơ đồ

Để phục vụ biên soạn báo cáo cuối cùng, có thể ưu tiên chèn ảnh theo thứ tự sau:
- Kiến trúc tổng quan: `docs/images/architectureDiagram/architecture-overview.png`
- Use Case đăng nhập: `docs/images/usecaseDiagram/auth-usecase.png`
- Sequence đăng nhập: `docs/images/sequenceDiagram/auth-login-sequence.png`
- Use Case tổng quan: `docs/images/usecaseDiagram/exam-system-usecase-overview.png`
- Sequence chuẩn bị kỳ thi và điểm danh: `docs/images/sequenceDiagram/exam-session-preparation-sequence.png`
- Sequence vào thi và lấy đề: `docs/images/sequenceDiagram/exam-entry-fetch-sequence.png`
- Sequence auto-save và recovery: `docs/images/sequenceDiagram/exam-autosave-recovery-sequence.png`
- Sequence nộp bài và xem kết quả: `docs/images/sequenceDiagram/exam-submit-grade-result-sequence.png`
- Sequence giám sát phòng thi: `docs/images/sequenceDiagram/invigilation-monitoring-sequence.png`
- Class Diagram hoặc ERD tổng hợp: `docs/images/classDiagram/domain-class-overview.png` hoặc `docs/07-erd.md`

---

## 7. Kết luận

Tài liệu này xác lập đặc tả yêu cầu cho `DAU Examination System` theo định hướng chuẩn hóa SRS, tập trung vào việc hệ thống phải làm gì, cách các phân hệ tương tác ở mức nghiệp vụ và các ràng buộc phi chức năng quan trọng.

Tài liệu là cơ sở để:
- Thiết kế chi tiết hệ thống.
- Ánh xạ yêu cầu sang API, cơ sở dữ liệu và giao diện.
- Lập kế hoạch kiểm thử và nghiệm thu.
- Duy trì thống nhất giữa nghiệp vụ và triển khai kỹ thuật.
