# 29. UML Source Pack cho báo cáo

Tài liệu này gom toàn bộ mã PlantUML cần dùng để tạo các ảnh chèn vào báo cáo.
Từ nay, nếu cần render lại ảnh, ưu tiên dùng file này thay vì `docs/21-usecase-sequence-uml.md`.

> File này cũng đã hấp thụ nội dung của `docs/thietkehethong.txt` (đã xóa) —
> xem ghi chú **kiến trúc hiện tại vs kiến trúc mục tiêu** ngay dưới đây.

## 1. Bộ ảnh chính nên dùng

| Thứ tự | Diagram ID | Tên ảnh đề xuất | Vai trò | Trạng thái |
|---|---|---|---|---|
| 1 | D01 | `docs/images/architectureDiagram/architecture-overview.png` | Kiến trúc tổng quan | current-state |
| 2 | D02 | `docs/images/usecaseDiagram/auth-usecase.png` | Use case đăng nhập và xác thực | current-state |
| 3 | D03 | `docs/images/sequenceDiagram/auth-login-sequence.png` | Sequence đăng nhập và xác thực | current-state |
| 4 | D04 | `docs/images/usecaseDiagram/exam-system-usecase-overview.png` | Use case tổng quan hệ thống | current-state |
| 5 | D05 | `docs/images/sequenceDiagram/exam-session-preparation-sequence.png` | Chuẩn bị kỳ thi và điểm danh | current-state |
| 6 | D06 | `docs/images/sequenceDiagram/exam-entry-fetch-sequence.png` | Sinh viên vào thi và lấy đề | current-state |
| 7 | D07 | `docs/images/sequenceDiagram/exam-autosave-recovery-sequence.png` | Làm bài, auto-save, recovery | **target-state** (kiến trúc Redis Cache + Write-Behind Worker cho tải lớn) |
| 8 | D08 | `docs/images/sequenceDiagram/exam-submit-grade-result-sequence.png` | Nộp bài, chấm điểm, xem kết quả | **target-state** (kiến trúc Message Queue + GradingWorker bất đồng bộ) |
| 9 | D09 | `docs/images/sequenceDiagram/invigilation-monitoring-sequence.png` | Giám sát phòng thi | **target-state / Phase 2** |
| 10 | D10 | `docs/images/classDiagram/domain-class-overview.png` | Class diagram tổng hợp | current-state |
| 11 | D11 | (ERD dbdiagram — đối chiếu `docs/07-erd.md`) | ERD chi tiết mức cột | current-state |

> ⚠️ **Quan trọng khi trình bày báo cáo/demo:** D07 và D08 mô tả kiến trúc
> **mục tiêu** (Redis, RabbitMQ/Kafka, worker bất đồng bộ) cho quy mô 2.000
> phiên đồng thời — đây **chưa phải** kiến trúc đang chạy thật. Theo
> `17-exam-core-integration.md`, `20-go-live-checklist.md` và
> `15-test-report-wave2-trac-nghiem.md`, hệ thống hiện tại lưu đáp án **thẳng
> vào PostgreSQL qua Prisma** (không Redis/message queue), và auto-submit dùng
> `@nestjs/schedule` cron mỗi phút — không phải cơ chế Write-Behind/Kafka như
> D07/D08 mô tả. Khi đưa D07/D08 vào báo cáo, **luôn ghi chú rõ "kiến trúc mục
> tiêu / định hướng mở rộng"**, tránh để người đọc hiểu nhầm đây là hiện trạng.

## 2. Nguyên tắc sử dụng

- `D01 -> D06`, `D10`, `D11` phản ánh đúng hiện trạng, dùng thẳng cho báo cáo nghiệp vụ.
- `D07`, `D08`, `D09` là kiến trúc/luồng **mục tiêu (target-state)** — luôn gắn nhãn rõ khi trình bày, không mô tả như đã hoàn thiện.
- `D10` là class diagram tổng hợp để chèn vào phần thiết kế dữ liệu và domain.
- Nếu cần ERD riêng mức cột, đối chiếu `docs/07-erd.md` hoặc `D11` bên dưới.

## 3. Nguồn PlantUML

### D01. Kiến trúc tổng quan

```plantuml
@startuml
title Sơ đồ Kiến trúc tổng quan - DAU Examination System

skinparam shadowing false
skinparam componentStyle rectangle
skinparam linetype ortho
skinparam nodesep 50
skinparam ranksep 50
skinparam arrowThickness 1.2
skinparam defaultTextAlignment center

actor "Sinh viên" as Student
actor "Giám thị" as Invigilator
actor "Cán bộ\nKhảo thí" as Officer
actor "Quản trị viên" as Admin

rectangle "DAU Examination System" {
  rectangle "Presentation Layer" as PL {
    [Cổng Sinh viên] as SP
    [Cổng Giám thị] as IP
    [Cổng Khảo thí\nvà Quản trị] as AP
  }

  rectangle "Cross-cutting Concerns\n(Security & Logging)" as Cross {
    [JWT / RBAC Security]
    [Audit Logging]
  }

  rectangle "Core Application Layer" as Core {
    [Authentication &\nAuthorization]
    [Exam Management]
    [Exam Attempt &\nSubmission]
    [Invigilation &\nMonitoring]
    [Violation &\nReporting]
  }

  rectangle "Integration Layer" as IntL {
    [SSO Adapter]
    [UMS Adapter]
    [Exam Core Adapter]
  }

  rectangle "Infrastructure & Data Layer" as Infra {
    database "PostgreSQL\n(Operational DB)" as DB
    collections "IndexedDB\n(Client Store)" as IDB
    [Realtime Monitoring\nGateway]
    [Auto-save /\nRecovery Engine]
  }
}

cloud "External Services" {
  cloud "SSO / IAM" as SSO
  cloud "UMS" as UMS
  cloud "Exam Core API" as ExamCore
}

Student --> SP
Invigilator --> IP
Officer --> AP
Admin --> AP

SP --> [Exam Attempt &\nSubmission]
IP --> [Invigilation &\nMonitoring]
AP --> [Exam Management]

PL .down.> Cross : Verify & Log
Core .right.> Cross : Secure & Log

Core -down-> DB : Read/Write Data
[Exam Attempt &\nSubmission] --> [Auto-save /\nRecovery Engine]
[Auto-save /\nRecovery Engine] --> IDB
[Invigilation &\nMonitoring] --> [Realtime Monitoring\nGateway]

IntL -up-> Core : Cung cấp API
[SSO Adapter] --> SSO
[UMS Adapter] --> UMS
[Exam Core Adapter] --> ExamCore
@enduml
```

### D02. Use Case - Đăng nhập và Xác thực

```plantuml
@startuml
left to right direction
skinparam shadowing false
skinparam roundcorner 14
skinparam actorStyle awesome

skinparam usecase {
  BackgroundColor White
  BorderColor #2C3E50
  FontName Arial
}

skinparam rectangle {
  BorderColor #2980B9
  FontColor #1F4E79
  FontStyle bold
}

actor "Sinh viên" as SV
rectangle "Hệ thống SSO" <<external system>> as SSO #F8F9F9

rectangle "Phân hệ Xác thực DAU Examination System" #EAF2F8 {
  usecase "Đăng nhập qua SSO" as UC_LOGIN
  usecase "Ghi nhật ký Audit" as UC_AUDIT #FDEDEC
}

SV -- UC_LOGIN
SSO -- UC_LOGIN

UC_LOGIN .> UC_AUDIT : <<include>>

note right of UC_LOGIN
  Tiền điều kiện:
  người dùng đã có tài khoản hợp lệ trên SSO.

  Hậu điều kiện:
  hệ thống đồng bộ hồ sơ và cấp phiên đăng nhập.
end note
@enduml
```

### D03. Sequence - Đăng nhập và Xác thực

```plantuml
@startuml
title Sơ đồ Tuần tự - Đăng nhập và Xác thực
autonumber
skinparam style strictuml
skinparam sequenceMessageAlign center

actor "Sinh viên" as SV
boundary "Cổng Sinh viên" as FE
control "AuthController" as AuthController
control "AuthService" as AuthService
control "SSOAdapter" as SSOAdapter
entity "UserRepository" as UserRepo
control "AuditService" as AuditService
database "CSDL Khảo thí" as DB
participant "Hệ thống SSO\n<<external system>>" as SSO

SV -> FE: chọn Đăng nhập
FE -> AuthController: yêu cầu đăng nhập SSO()
AuthController -> SSOAdapter: xác thực danh tính()
SSOAdapter -> SSO: validateToken / lấy hồ sơ người dùng
SSO --> SSOAdapter: userProfile, roles
SSOAdapter --> AuthController: hồ sơ đã xác thực

AuthController -> AuthService: đồng bộ tài khoản và cấp phiên()
AuthService -> UserRepo: tìm hoặc cập nhật người dùng
UserRepo -> DB: SELECT / UPSERT User, UserRole
DB --> UserRepo: bản ghi người dùng
UserRepo --> AuthService: userAggregate

AuthService -> AuditService: ghi nhận sự kiện đăng nhập
AuditService -> DB: INSERT AuditLog
DB --> AuditService: auditLogId

AuthService --> AuthController: accessToken, refreshToken, userInfo
AuthController --> FE: kết quả đăng nhập
FE --> SV: hiển thị dashboard
@enduml
```

### D04. Use Case tổng quan hệ thống

```plantuml
@startuml
left to right direction
skinparam shadowing false
skinparam roundcorner 14
skinparam actorStyle awesome

skinparam usecase {
  BackgroundColor White
  BorderColor #2C3E50
  FontName Arial
}

skinparam rectangle {
  BorderColor #2980B9
  FontColor #1F4E79
  FontStyle bold
}

actor "SSO" as SSO
actor "Sinh viên" as SV
actor "Giám thị" as GT
actor "Khảo thí" as KT
actor "Quản trị viên" as AD
rectangle "Exam Core API\n<<external system>>" as EXAMCORE #F8F9F9
rectangle "UMS\n<<external system>>" as UMS #F8F9F9
rectangle "SSO\n<<external system>>" as SYS_SSO #F8F9F9

rectangle "Hệ thống Thi trắc nghiệm DAU (MVP)" {
  rectangle "Cổng Sinh viên" as R_STUDENT #EAF2F8 {
    usecase "Đăng nhập qua SSO" as UC_LOGIN
    usecase "Xem lịch thi" as UC_SCHEDULE
    usecase "Tham gia thi" as UC_EXAM
    usecase "Nộp bài thi" as UC_SUBMIT
    usecase "Tra cứu kết quả" as UC_RESULT
  }

  rectangle "Cổng Quản trị và Giám thị" as R_ADMIN #FEF9E7 {
    usecase "Điểm danh thí sinh" as UC_ATTEND
    usecase "Giám sát phòng thi" as UC_MONITOR
    usecase "Quản lý kỳ thi và ca thi" as UC_EXAM_ADMIN
    usecase "Công bố kết quả thi" as UC_PUBLISH
    usecase "Xuất báo cáo thống kê" as UC_REPORT
    usecase "Quản lý hệ thống" as UC_ADMIN
    usecase "Đồng bộ hồ sơ sinh viên" as UC_SYNC_UMS
  }

  usecase "Lấy đề thi từ Exam Core" as UC_FETCH_EXAM
  usecase "Ghi nhật ký Audit" as UC_AUDIT #FDEDEC
}

SV -- UC_LOGIN
SYS_SSO -- UC_LOGIN
SV -- UC_LOGIN
SV -- UC_SCHEDULE
SV -- UC_EXAM
SV -- UC_SUBMIT
SV -- UC_RESULT

GT -- UC_ATTEND
GT -- UC_MONITOR

KT -- UC_EXAM_ADMIN
KT -- UC_PUBLISH
KT -- UC_REPORT

AD -- UC_REPORT
AD -- UC_ADMIN
AD -- UC_SYNC_UMS

UC_FETCH_EXAM -- EXAMCORE
UC_SYNC_UMS -- UMS

UC_EXAM ..> UC_FETCH_EXAM : <<include>>
UC_LOGIN ..> UC_AUDIT : <<include>>
UC_EXAM ..> UC_AUDIT : <<include>>
UC_SUBMIT ..> UC_AUDIT : <<include>>
UC_ATTEND ..> UC_AUDIT : <<include>>
UC_MONITOR ..> UC_AUDIT : <<include>>
UC_ADMIN ..> UC_AUDIT : <<include>>
UC_EXAM_ADMIN ..> UC_AUDIT : <<include>>
UC_PUBLISH ..> UC_AUDIT : <<include>>
@enduml
```

### D05. Sequence - Chuẩn bị kỳ thi và điểm danh

```plantuml
@startuml
title Biểu đồ Tuần tự 1 - Chuẩn bị kỳ thi và điểm danh
autonumber
skinparam style strictuml
skinparam sequenceMessageAlign center

actor "Khảo thí" as KhaoThi
actor "Giám thị" as GiamThi
boundary "Cổng Quản trị và Giám thị" as FE
control "ExamSessionController" as SessionController
control "ExamSessionService" as SessionService
control "AttendanceController" as AttendanceController
control "AttendanceService" as AttendanceService
control "UMSAdapter" as UMSAdapter
entity "ExamSessionRepository" as SessionRepo
entity "RoomAssignmentRepository" as RoomRepo
entity "AttendanceRepository" as AttendanceRepo
control "AuditService" as AuditService
database "CSDL Khảo thí" as DB
participant "UMS\n<<external system>>" as UMS

KhaoThi -> FE: tạo cấu hình ca thi
FE -> SessionController: createExamSession(configData)
SessionController -> SessionService: validateAndCreateSession(configData)
SessionService -> UMSAdapter: lấy danh sách sinh viên đăng ký
UMSAdapter -> UMS: fetchRegisteredStudents(examId)
UMS --> UMSAdapter: studentList
UMSAdapter --> SessionService: studentList
SessionService -> SessionRepo: lưu kỳ thi, ca thi, cấu hình mở ca
SessionRepo -> DB: INSERT Exam / Session / SessionExam
DB --> SessionRepo: sessionId
SessionService -> RoomRepo: lưu phân phòng và phân công
RoomRepo -> DB: INSERT RoomAssignment / InvigilatorAssignment
DB --> RoomRepo: rows affected
SessionService -> AuditService: ghi nhận thay đổi cấu hình
AuditService -> DB: INSERT AuditLog
DB --> AuditService: auditLogId
SessionService --> SessionController: sessionReady
SessionController --> FE: kết quả khởi tạo ca thi
FE --> KhaoThi: hiển thị ca thi đã mở

GiamThi -> FE: mở danh sách phòng được phân công
FE -> AttendanceController: getAssignedRoomRoster(roomId)
AttendanceController -> AttendanceService: loadRoomRoster(roomId)
AttendanceService -> RoomRepo: lấy danh sách thí sinh
RoomRepo -> DB: SELECT RoomAssignment, Student, Attendance
DB --> RoomRepo: roomRoster
RoomRepo --> AttendanceService: roomRoster
AttendanceService --> AttendanceController: roomRoster
AttendanceController --> FE: dữ liệu điểm danh
FE --> GiamThi: hiển thị danh sách phòng

GiamThi -> FE: xác nhận điểm danh thí sinh
FE -> AttendanceController: markAttendance(studentId, status)
AttendanceController -> AttendanceService: recordAttendance(attendanceData)
AttendanceService -> AttendanceRepo: lưu trạng thái điểm danh
AttendanceRepo -> DB: UPSERT Attendance
DB --> AttendanceRepo: rows affected
AttendanceService -> AuditService: ghi nhận sự kiện điểm danh
AuditService -> DB: INSERT AuditLog
DB --> AuditService: auditLogId
AttendanceService --> AttendanceController: attendanceRecorded
AttendanceController --> FE: kết quả điểm danh
FE --> GiamThi: hiển thị kết quả
@enduml
```

### D06. Sequence - Sinh viên vào thi và lấy đề

```plantuml
@startuml
title Biểu đồ Tuần tự 2 - Sinh viên vào thi và lấy đề thi
autonumber
skinparam style strictuml
skinparam sequenceMessageAlign center

actor "Sinh viên" as SV
boundary "Cổng Sinh viên" as FE
control "ExamEntryController" as EntryController
control "ExamEntryService" as EntryService
control "EligibilityPolicy" as EligibilityPolicy
control "ExamCoreAdapter" as ExamCoreAdapter
entity "ExamAttemptRepository" as AttemptRepo
entity "QuestionSnapshotRepository" as SnapshotRepo
control "AuditService" as AuditService
database "CSDL Khảo thí" as DB
participant "Exam Core API\n<<external system>>" as ExamCore

SV -> FE: chọn Bắt đầu thi
FE -> EntryController: startExam(examId, clientInfo)
EntryController -> EntryService: initiateExamAttempt(examId, clientInfo)
EntryService -> EligibilityPolicy: kiểm tra điều kiện dự thi
EligibilityPolicy -> AttemptRepo: lấy dữ liệu phân công và điểm danh
AttemptRepo -> DB: SELECT Assignment, Attendance, AttemptPolicy
DB --> AttemptRepo: eligibilityData
AttemptRepo --> EligibilityPolicy: eligibilityData
EligibilityPolicy --> EntryService: eligible

EntryService -> AttemptRepo: tạo hoặc khôi phục ExamAttempt
AttemptRepo -> DB: INSERT / SELECT ExamAttempt
DB --> AttemptRepo: attemptId, startedAt
AttemptRepo --> EntryService: currentAttempt

EntryService -> ExamCoreAdapter: lấy snapshot đề thi
ExamCoreAdapter -> ExamCore: getExamSnapshot(examId)
ExamCore --> ExamCoreAdapter: examSnapshotData
ExamCoreAdapter --> EntryService: examSnapshotData

EntryService -> SnapshotRepo: lưu snapshot câu hỏi cho attempt
SnapshotRepo -> DB: INSERT QuestionSnapshot / AttemptQuestion
DB --> SnapshotRepo: rows affected
EntryService -> AuditService: ghi nhận sự kiện bắt đầu thi
AuditService -> DB: INSERT AuditLog
DB --> AuditService: auditLogId

EntryService --> EntryController: attemptDetails, safeQuestionList
EntryController --> FE: dữ liệu vào thi
FE --> SV: hiển thị giao diện làm bài
@enduml
```

### D07. Sequence - Làm bài, auto-save và recovery

```plantuml
@startuml
title Biểu đồ Tuần tự 3 - Làm bài, Auto-save và Đồng bộ ngầm (Write-Behind)
autonumber
skinparam style strictuml
skinparam sequenceMessageAlign center

actor "Sinh viên" as SV
boundary "Cổng Sinh viên\n(Local Cache)" as FE
control "AttemptController" as AttemptController
control "AnswerService" as AnswerService
database "Redis Cache" as Redis
control "WriteBehindWorker\n(Background Job)" as Worker
entity "AnswerRepository" as AnswerRepo
database "CSDL PostgreSQL" as DB

== Luồng tương tác của Sinh viên (Độ trễ thấp) ==

SV -> FE: chọn đáp án
FE -> FE: lưu trạng thái cục bộ
FE -> AttemptController: submitSingleAnswer(attemptId, answerData)
AttemptController -> AnswerService: saveAnswer(attemptId, answerData)
AnswerService -> Redis: HSET attempt_answers:{id} answerData
Redis --> AnswerService: OK
AnswerService --> AttemptController: saveAcknowledged
AttemptController --> FE: trạng thái lưu thành công (tại Cache)
FE --> SV: cập nhật UI (đã lưu)

== Chu trình Auto-save (Mỗi 30 giây) ==

FE -> AttemptController: autoSaveHeartbeat(attemptId, localSnapshot)
AttemptController -> AnswerService: updateHeartbeat(attemptId)
AnswerService -> Redis: HSET attempt_status:{id} last_active_time
Redis --> AnswerService: OK
AnswerService --> AttemptController: autoSaveCompleted
AttemptController --> FE: xác nhận heartbeat

== Chu trình Đồng bộ ngầm (Write-Behind - Mỗi 1 phút) ==

loop Mỗi 1 phút
    Worker -> Redis: SCAN các attempt đang active
    Redis --> Worker: danh sách attemptIds
    
    Worker -> Redis: HGETALL attempt_answers:{id}
    Redis --> Worker: toàn bộ đáp án mới nhất
    
    Worker -> AnswerRepo: bulkUpsertAnswers(answersList)
    AnswerRepo -> DB: BULK UPSERT AttemptAnswer
    DB --> AnswerRepo: rows affected
    AnswerRepo --> Worker: syncCompleted
end
@enduml```

### D08. Sequence - Nộp bài, chấm điểm và xem kết quả

```plantuml
@startuml
title Biểu đồ Tuần tự 4 - Nộp bài (Flush Data) và Chấm điểm bất đồng bộ
autonumber
skinparam style strictuml
skinparam sequenceMessageAlign center

actor "Sinh viên" as SV
boundary "Cổng Sinh viên" as FE
control "SubmissionService" as SubmissionService
database "Redis Cache" as Redis
entity "AttemptRepository" as AttemptRepo
database "CSDL PostgreSQL" as DB
queue "Message Queue\n(RabbitMQ/Kafka)" as MQ
control "GradingWorker" as GradingWorker
control "GradingService" as GradingService

== Luồng Nộp bài (Synchronous - Đảm bảo tính toàn vẹn) ==

SV -> FE: xác nhận nộp bài
note right of FE: Đính kèm payload đáp án cuối\ncùng từ trình duyệt (Fallback)
FE -> SubmissionService: submitAttempt(attemptId, localPayload)

SubmissionService -> Redis: acquireLock("lock:submit:{id}")
Redis --> SubmissionService: lockAcquired

alt Flush từ Redis thành công
    SubmissionService -> Redis: HGETALL attempt_answers:{id}
    Redis --> SubmissionService: cacheAnswers
    SubmissionService -> AttemptRepo: bulkUpsertAnswers(cacheAnswers)
else Lỗi kết nối Redis (Fallback an toàn)
    SubmissionService -> AttemptRepo: bulkUpsertAnswers(localPayload)
end

AttemptRepo -> DB: BULK UPSERT AttemptAnswer
DB --> AttemptRepo: success

SubmissionService -> AttemptRepo: updateStatus(SUBMITTED)
AttemptRepo -> DB: UPDATE ExamAttempt
DB --> AttemptRepo: success

SubmissionService -> Redis: DEL attempt_answers:{id} (Giải phóng RAM)
SubmissionService -> Redis: releaseLock("lock:submit:{id}")

SubmissionService -> MQ: publishEvent(Grade_Attempt_Event, attemptId)
SubmissionService --> FE: HTTP 200 - Nộp bài thành công
FE --> SV: hiển thị "Đang xử lý kết quả..."

== Luồng Chấm điểm (Asynchronous - Chống tắc nghẽn) ==

MQ -> GradingWorker: consume(Grade_Attempt_Event)
GradingWorker -> GradingService: triggerGrading(attemptId)
GradingService -> AttemptRepo: findAttemptWithAnswers(attemptId)
AttemptRepo -> DB: SELECT (Lấy dữ liệu đã flush an toàn)
DB --> AttemptRepo: gradingData
AttemptRepo --> GradingService: gradingData

GradingService -> GradingService: evaluateScore()
GradingService -> DB: INSERT Result
DB --> GradingService: success
GradingWorker -> MQ: ackMessage()
@enduml
```

### D09. Sequence - Giám sát phòng thi và cảnh báo sự cố

```plantuml
@startuml
title Biểu đồ Tuần tự 4 - Nộp bài (Flush Data) và Chấm điểm bất đồng bộ
autonumber
skinparam style strictuml
skinparam sequenceMessageAlign center

actor "Sinh viên" as SV
boundary "Cổng Sinh viên" as FE
control "SubmissionService" as SubmissionService
database "Redis Cache" as Redis
entity "AttemptRepository" as AttemptRepo
database "CSDL PostgreSQL" as DB
queue "Message Queue\n(RabbitMQ/Kafka)" as MQ
control "GradingWorker" as GradingWorker
control "GradingService" as GradingService

== Luồng Nộp bài (Synchronous - Đảm bảo tính toàn vẹn) ==

SV -> FE: xác nhận nộp bài
note right of FE: Đính kèm payload đáp án cuối\ncùng từ trình duyệt (Fallback)
FE -> SubmissionService: submitAttempt(attemptId, localPayload)

SubmissionService -> Redis: acquireLock("lock:submit:{id}")
Redis --> SubmissionService: lockAcquired

alt Flush từ Redis thành công
    SubmissionService -> Redis: HGETALL attempt_answers:{id}
    Redis --> SubmissionService: cacheAnswers
    SubmissionService -> AttemptRepo: bulkUpsertAnswers(cacheAnswers)
else Lỗi kết nối Redis (Fallback an toàn)
    SubmissionService -> AttemptRepo: bulkUpsertAnswers(localPayload)
end

AttemptRepo -> DB: BULK UPSERT AttemptAnswer
DB --> AttemptRepo: success

SubmissionService -> AttemptRepo: updateStatus(SUBMITTED)
AttemptRepo -> DB: UPDATE ExamAttempt
DB --> AttemptRepo: success

SubmissionService -> Redis: DEL attempt_answers:{id} (Giải phóng RAM)
SubmissionService -> Redis: releaseLock("lock:submit:{id}")

SubmissionService -> MQ: publishEvent(Grade_Attempt_Event, attemptId)
SubmissionService --> FE: HTTP 200 - Nộp bài thành công
FE --> SV: hiển thị "Đang xử lý kết quả..."

== Luồng Chấm điểm (Asynchronous - Chống tắc nghẽn) ==

MQ -> GradingWorker: consume(Grade_Attempt_Event)
GradingWorker -> GradingService: triggerGrading(attemptId)
GradingService -> AttemptRepo: findAttemptWithAnswers(attemptId)
AttemptRepo -> DB: SELECT (Lấy dữ liệu đã flush an toàn)
DB --> AttemptRepo: gradingData
AttemptRepo --> GradingService: gradingData

GradingService -> GradingService: evaluateScore()
GradingService -> DB: INSERT Result
DB --> GradingService: success
GradingWorker -> MQ: ackMessage()
@enduml
```

### D10. Class Diagram tổng hợp

```plantuml
@startuml
left to right direction
skinparam shadowing false
skinparam roundcorner 12
skinparam classAttributeIconSize 0
skinparam packageStyle rectangle

hide empty methods

package "Identity & Security" {
  class User {
    +id: UUID
    +email: String
    +fullName: String
    +avatar: String
    +status: UserStatus
    +lastLoginAt: DateTime
    +createdAt: DateTime
    +updatedAt: DateTime
  }

  class Role {
    +id: UUID
    +code: RoleCode
    +name: String
  }

  class UserRole {
    +userId: UUID
    +roleId: UUID
  }

  class AuditLog {
    +id: UUID
    +userId: UUID
    +action: String
    +entityType: String
    +entityId: UUID
    +oldValue: JSON
    +newValue: JSON
    +ipAddress: String
    +createdAt: DateTime
  }

  class SystemConfig {
    +id: UUID
    +key: String
    +value: String
    +description: String
    +updatedAt: DateTime
  }

  class Student {
    +id: UUID
    +studentCode: String
    +fullName: String
    +email: String
    +className: String
    +facultyName: String
    +status: String
  }
}

package "Exam Planning & Room" {
  class Exam {
    +id: UUID
    +code: String
    +name: String
    +academicYear: String
    +semester: String
    +startDate: Date
    +endDate: Date
    +status: ExamStatus
  }

  class ExamPeriod {
    +id: UUID
    +code: String
    +name: String
    +startDate: Date
    +endDate: Date
  }

  class ExamSession {
    +id: UUID
    +code: String
    +name: String
    +examDate: Date
    +startTime: DateTime
    +endTime: DateTime
    +durationMinutes: Int
    +status: SessionStatus
  }

  class ExamDefinition {
    +id: UUID
    +externalExamId: String
    +code: String
    +title: String
    +durationMinutes: Int
    +totalQuestions: Int
    +showResult: Boolean
    +showAnswers: Boolean
    +showExplanation: Boolean
    +shuffleQuestion: Boolean
    +shuffleAnswer: Boolean
    +maxAttempt: Int
    +sourceSystem: String
  }

  class SessionExam {
    +id: UUID
    +sessionId: UUID
    +examDefinitionId: UUID
  }
  class ExamRoom {
    +id: UUID
    +code: String
    +name: String
    +capacity: Int
    +location: String
  }

  class RoomAssignment {
    +id: UUID
    +roomId: UUID
    +studentId: UUID
    +sessionId: UUID
    +seatNumber: String
    +machineNumber: String
  }

  class InvigilatorAssignment {
    +id: UUID
    +roomId: UUID
    +invigilatorId: UUID
    +sessionId: UUID
  }

  class Attendance {
    +id: UUID
    +studentId: UUID
    +sessionId: UUID
    +roomId: UUID
    +status: AttendanceStatus
    +attendanceAt: DateTime
    +attendanceBy: UUID
  }
}

package "Attempt & Result Domain" {
  class ExamAttempt {
    +id: UUID
    +studentId: UUID
    +sessionId: UUID
    +examDefinitionId: UUID
    +status: AttemptStatus
    +startedAt: DateTime
    +submittedAt: DateTime
    +remainingSeconds: Int
    +clientIp: String
    +userAgent: String
  }

  class QuestionSnapshot {
    +id: UUID
    +externalQuestionId: String
    +title: String
    +content: Text
    +type: QuestionType
    +mediaUrl: String
    +correctAnswer: String
    +explanation: Text
    +difficulty: String
    +sourceSystem: String
  }

  class AttemptQuestion {
    +id: UUID
    +attemptId: UUID
    +questionId: UUID
    +questionOrder: Int
    +questionContent: Text
    +questionType: QuestionType
    +questionSnapshot: JSON
  }

  class AttemptAnswer {
    +id: UUID
    +attemptId: UUID
    +questionId: UUID
    +answerValue: String
    +isCorrect: Boolean
    +answeredAt: DateTime
  }

  class Result {
    +id: UUID
    +attemptId: UUID
    +studentId: UUID
    +examDefinitionId: UUID
    +totalQuestions: Int
    +correctAnswers: Int
    +wrongAnswers: Int
    +score: Decimal
    +grade: String
    +published: Boolean
    +publishedAt: DateTime
  }

  class Violation {
    +id: UUID
    +studentId: UUID
    +sessionId: UUID
    +roomId: UUID
    +machineNumber: String
    +type: ViolationType
    +description: String
    +recordedBy: String
    +recordedAt: DateTime
  }

  class ViolationAttachment {
    +id: UUID
    +violationId: UUID
    +fileName: String
    +fileUrl: String
    +uploadedAt: DateTime
  }

  class ReportExport {
    +id: UUID
    +reportType: String
    +fileUrl: String
    +generatedBy: UUID
    +generatedAt: DateTime
  }
}

enum RoleCode {
  STUDENT
  INVIGILATOR
  EXAM_OFFICER
  ADMIN
}

enum UserStatus {
  ACTIVE
  INACTIVE
}

enum ExamStatus {
  DRAFT
  OPEN
  CLOSED
}

enum SessionStatus {
  UPCOMING
  OPEN
  CLOSED
  EXTENDED
}

enum AttendanceStatus {
  PRESENT
  ABSENT
  LATE
  VIOLATION
}

enum AttemptStatus {
  NOT_STARTED
  IN_PROGRESS
  SUBMITTED
  EXPIRED
}

enum QuestionType {
  SINGLE_CHOICE
  MULTIPLE_CHOICE
  TRUE_FALSE
  ESSAY
}

enum ViolationType {
  TAB_SWITCH
  FULLSCREEN_EXIT
  DEVICE_CHECK_FAIL
  LATE_LOGIN
  MANUAL_RECORD
}

User "1" o-- "0..*" UserRole
Role "1" o-- "0..*" UserRole
User "1" o-- "0..*" AuditLog
User "1" --> "0..1" Student : hồ sơ liên kết

Exam "1" *-- "1..*" ExamPeriod
ExamPeriod "1" *-- "1..*" ExamSession
ExamSession "1" o-- "1..*" SessionExam
SessionExam "0..*" --> "1" ExamDefinition

ExamRoom "1" o-- "0..*" RoomAssignment
ExamSession "1" o-- "0..*" RoomAssignment
Student "1" --> "0..*" RoomAssignment

ExamRoom "1" o-- "0..*" InvigilatorAssignment
ExamSession "1" o-- "0..*" InvigilatorAssignment

ExamSession "1" o-- "0..*" Attendance
ExamRoom "1" o-- "0..*" Attendance
Student "1" --> "0..*" Attendance

ExamSession "1" o-- "0..*" ExamAttempt
ExamDefinition "1" --> "0..*" ExamAttempt
Student "1" --> "0..*" ExamAttempt

ExamAttempt "1" *-- "1..*" AttemptQuestion
ExamAttempt "1" *-- "0..*" AttemptAnswer
QuestionSnapshot "1" --> "0..*" AttemptQuestion
AttemptQuestion "1" --> "0..*" AttemptAnswer : được trả lời bởi
ExamAttempt "1" *-- "0..1" Result
Student "1" --> "0..*" Result
ExamDefinition "1" --> "0..*" Result

ExamSession "1" o-- "0..*" Violation
ExamRoom "1" o-- "0..*" Violation
Student "1" --> "0..*" Violation
Violation "1" *-- "0..*" ViolationAttachment

note right of ExamAttempt
  ExamAttempt là thực thể trung tâm của luồng làm bài:
  quản lý trạng thái, thời gian còn lại
  và liên kết tới đáp án, kết quả, vi phạm.
end note

note bottom of AttemptAnswer
  Trong triển khai tải lớn,
  có thể bổ sung Redis như tầng đệm ghi tạm
  trước khi đồng bộ xuống cơ sở dữ liệu.
end note
@enduml
```
### D11 ERD
```plantuml
// ==========================================
// 1. IDENTITY & SECURITY DOMAIN
// ==========================================
Table User {
  id uuid [primary key]
  username varchar
  fullname varchar
  email varchar
  avatar varchar
  status varchar
  isDeleted boolean
  deletedAt timestamp
  lastLoginAt timestamp
  createdAt timestamp
  updatedAt timestamp
}

Table Role {
  id uuid [primary key]
  code varchar
  name varchar
}

Table UserRole {
  userId uuid
  roleId uuid
}

Table StudentProfile {
  id uuid [primary key]
  userId uuid 
  studentCode varchar
  fullName varchar
  className varchar
}

// ==========================================
// 2. EXAM PLANNING DOMAIN
// ==========================================
Table Exam {
  id uuid [primary key]
  code varchar
  name varchar
  academicYear varchar
  semester varchar
  startDate timestamp
  endDate timestamp
  status varchar
  createdAt timestamp
  updatedAt timestamp
}

Table ExamDefinition {
  id uuid [primary key]
  examId uuid
  code varchar
  title varchar
  durationMinutes integer
  totalQuestions integer
  sourceSystem varchar
  showResult boolean
  showAnswers boolean
  showExplanation boolean
  createdAt timestamp
}

Table ExamPeriod {
  id uuid [primary key]
  examId uuid
  code varchar
  name varchar
  startDate timestamp
  endDate timestamp
  createdAt timestamp
}

Table ExamSession {
  id uuid [primary key]
  periodId uuid
  code varchar
  name varchar
  examDate date
  startTime timestamp
  endTime timestamp
  durationMinutes integer
  status varchar
  createdBy uuid
  updatedBy uuid
  createdAt timestamp
  updatedAt timestamp
}

Table SessionRoom {
  id uuid [primary key]
  sessionId uuid
  roomId uuid
  examDefinitionId uuid
}

// ==========================================
// 3. ROOM & ASSIGNMENT DOMAIN
// ==========================================
Table ExamRoom {
  id uuid [primary key]
  code varchar
  name varchar
  capacity integer
  location varchar
  createdAt timestamp
  updatedAt timestamp
}

Table RoomAssignment {
  id uuid [primary key]
  roomId uuid
  sessionId uuid
  studentId uuid
  seatNumber varchar
  machineNumber varchar
  createdAt timestamp
}

Table InvigilatorAssignment {
  id uuid [primary key]
  roomId uuid
  invigilatorId uuid
  sessionId uuid
  createdAt timestamp
}

// ==========================================
// 4. ATTEMPT & MONITORING DOMAIN
// ==========================================
Table Attendance {
  id uuid [primary key]
  studentId uuid
  sessionId uuid
  roomId uuid
  status varchar
  attendanceTime timestamp
  createdAt timestamp
}

Table ExamAttempt {
  id uuid [primary key]
  studentId uuid
  sessionId uuid
  examDefinitionId uuid
  status varchar
  startTime timestamp
  submitTime timestamp
  remainingSeconds integer
  score float
  clientIp varchar
  userAgent varchar
  createdAt timestamp
}

Table QuestionSnapshot {
  id uuid [primary key]
  externalQuestionId varchar
  title varchar
  content text
  type varchar
  mediaUrl varchar
  correctAnswer text
  explanation text
  difficulty varchar
  sourceSystem varchar
  createdAt timestamp
}

Table AttemptQuestion {
  id uuid [primary key]
  attemptId uuid
  questionId uuid
  questionOrder integer
  questionContent text
  questionType varchar
  questionSnapshot text
  createdAt timestamp
}

Table AttemptAnswer {
  id uuid [primary key]
  attemptId uuid
  questionId uuid
  answerValue text
  isCorrect boolean
  answeredAt timestamp
}

// ==========================================
// 5. RESULTS & VIOLATION DOMAIN
// ==========================================
Table Result {
  id uuid [primary key]
  attemptId uuid
  studentId uuid
  examDefinitionId uuid
  totalQuestions integer
  correctAnswers integer
  wrongAnswers integer
  score float
  grade varchar
  published boolean
  publishedAt timestamp
  createdAt timestamp
  updatedAt timestamp
}

Table Violation {
  id uuid [primary key]
  studentId uuid
  sessionId uuid
  roomId uuid
  machineNumber varchar
  type varchar
  description text
  recordedBy uuid
  recordedAt timestamp
  createdAt timestamp
  updatedAt timestamp
}

Table ViolationAttachment {
  id uuid [primary key]
  violationId uuid
  fileName varchar
  fileUrl varchar
  uploadedAt timestamp
}

// ==========================================
// 6. SYSTEM & AUDIT DOMAIN
// ==========================================
Table ReportExport {
  id uuid [primary key]
  reportType varchar
  fileUrl varchar
  generatedBy uuid
  createdAt timestamp
}

Table Auditing {
  id uuid [primary key]
  userId uuid
  action varchar
  entityType varchar
  entityId uuid
  oldValue text
  newValue text
  ipAddress varchar
  createdAt timestamp
}

Table SystemConfig {
  id uuid [primary key]
  key varchar
  value text
  description varchar
  updatedBy uuid 
  updatedAt timestamp
}

// ==========================================
// RELATIONSHIPS (FOREIGN KEYS)
// ==========================================

// Identity & System Auditing
Ref: UserRole.userId > User.id
Ref: UserRole.roleId > Role.id
Ref: StudentProfile.userId > User.id
Ref: SystemConfig.updatedBy > User.id
Ref: Auditing.userId > User.id
Ref: ReportExport.generatedBy > User.id

// Exam Definition & Session
Ref: ExamPeriod.examId > Exam.id
Ref: ExamDefinition.examId > Exam.id
Ref: ExamSession.periodId > ExamPeriod.id
Ref: ExamSession.createdBy > User.id
Ref: ExamSession.updatedBy > User.id

// Room & Assignments
Ref: SessionRoom.sessionId > ExamSession.id
Ref: SessionRoom.roomId > ExamRoom.id
Ref: SessionRoom.examDefinitionId > ExamDefinition.id
Ref: RoomAssignment.roomId > ExamRoom.id
Ref: RoomAssignment.sessionId > ExamSession.id
Ref: RoomAssignment.studentId > StudentProfile.id
Ref: InvigilatorAssignment.roomId > ExamRoom.id
Ref: InvigilatorAssignment.sessionId > ExamSession.id
Ref: InvigilatorAssignment.invigilatorId > User.id

// Attempt & Monitoring
Ref: Attendance.studentId > StudentProfile.id
Ref: Attendance.sessionId > ExamSession.id
Ref: Attendance.roomId > ExamRoom.id

Ref: ExamAttempt.studentId > StudentProfile.id
Ref: ExamAttempt.sessionId > ExamSession.id
Ref: ExamAttempt.examDefinitionId > ExamDefinition.id

Ref: AttemptQuestion.attemptId > ExamAttempt.id
Ref: AttemptQuestion.questionId > QuestionSnapshot.id
Ref: AttemptAnswer.attemptId > ExamAttempt.id
Ref: AttemptAnswer.questionId > AttemptQuestion.id

// Result & Violation
Ref: Result.attemptId > ExamAttempt.id
Ref: Result.studentId > StudentProfile.id
Ref: Result.examDefinitionId > ExamDefinition.id

Ref: Violation.studentId > StudentProfile.id
Ref: Violation.sessionId > ExamSession.id
Ref: Violation.roomId > ExamRoom.id
Ref: Violation.recordedBy > User.id
Ref: ViolationAttachment.violationId > Violation.id
```