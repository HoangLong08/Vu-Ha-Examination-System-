# 21. Use Case và Sequence — Nguồn UML + Ghi chú review/định hướng tương lai

> File này gộp 4 tài liệu cũ (`21-bao-cao-usecase-sequence.md`,
> `22-nhan-xet-usecase-sequence.md`, `23-ok-che-usecase-sequence-tuong-lai.md`,
> `24-bao-cao-usecase-sequence-tuong-lai.md`) thành một file duy nhất để tránh
> phân mảnh. Cấu trúc:
> - **Phần 1-8**: nguồn PlantUML use case/sequence gốc (current-state / core flow MVP).
> - **Phần 9**: ghi chú review + định hướng tương lai (rút gọn từ 3 file cũ).
>
> Để render lại **bộ ảnh chính** dùng cho báo cáo, ưu tiên dùng
> `docs/29-uml-source-pack.md` (đã hợp nhất, có nhãn current-state/target-state
> rõ ràng). File này giữ lại làm nguồn tham khảo current-state / core flow gốc.

Tài liệu tổng hợp mã sơ đồ PlantUML đồng bộ với:
- `docs/02-srs.md`
- `docs/03-use-cases.md`
- `docs/08-api-contract.md`
- `docs/17-exam-core-integration.md`
- `docs/18-auth-integration.md`

Lưu ý: các sequence bên dưới ưu tiên đúng nghiệp vụ và đúng API contract. Một số
luồng thể hiện mục tiêu nghiệp vụ tổng thể; các phần implementation chưa hoàn tất
được ghi chú ở Phần 9.

## 1. Use Case tổng quan hệ thống

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
actor "Sinh vien" as SV
actor "Giam thi" as GT
actor "Khao thi" as KT
actor "Quan tri vien" as AD
actor "Exam Core API" as EXAMCORE
actor "UMS" as UMS

rectangle "He thong Thi trac nghiem DAU (MVP)" {
  rectangle "Cong Sinh vien" as R_STUDENT #EAF2F8 {
    usecase "Dang nhap qua SSO" as UC_LOGIN
    usecase "Xem lich thi" as UC_SCHEDULE
    usecase "Tham gia thi" as UC_EXAM
    usecase "Nop bai thi" as UC_SUBMIT
    usecase "Tra cuu ket qua" as UC_RESULT
  }

  rectangle "Cong Quan tri va Giam thi" as R_ADMIN #FEF9E7 {
    usecase "Diem danh thi sinh" as UC_ATTEND
    usecase "Giam sat phong thi" as UC_MONITOR
    usecase "Quan ly ky thi va ca thi" as UC_EXAM_ADMIN
    usecase "Cong bo ket qua thi" as UC_PUBLISH
    usecase "Xuat bao cao thong ke" as UC_REPORT
    usecase "Quan ly he thong" as UC_ADMIN
    usecase "Dong bo ho so sinh vien" as UC_SYNC_UMS
  }

  usecase "Lay de thi tu Exam Core" as UC_FETCH_EXAM
  usecase "Ghi nhat ky Audit" as UC_AUDIT #FDEDEC
}

SSO -- UC_LOGIN
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

UC_EXAM .> UC_FETCH_EXAM : <<include>>
UC_LOGIN .[#Black].> UC_AUDIT : <<include>>
UC_EXAM .[#Black].> UC_AUDIT : <<include>>
UC_SUBMIT .[#Black].> UC_AUDIT : <<include>>
UC_ATTEND .[#Black].> UC_AUDIT : <<include>>
UC_MONITOR .[#Black].> UC_AUDIT : <<include>>
UC_ADMIN .[#Black].> UC_AUDIT : <<include>>
UC_EXAM_ADMIN .[#Black].> UC_AUDIT : <<include>>
UC_PUBLISH .[#Black].> UC_AUDIT : <<include>>
@enduml
```

> **Ghi chú (từ review):** use case `Lấy đề thi từ Exam Core` là luồng
> **hệ thống nội bộ** (system/integration use case), được `Tham gia thi` include —
> **không phải** thao tác nghiệp vụ do actor `Khảo thí` chủ động kích hoạt cho
> từng lượt thi (xem UC-060 trong `03-use-cases.md`). Sơ đồ trên đã đặt đúng vị
> trí; xem thêm mục 9.1.

## 2. Sequence - Chuan bi ky thi va diem danh

Phu hop voi:
- FR-C, FR-D, FR-E
- UC-025, UC-027, UC-036 -> UC-042

```plantuml
@startuml
title Bieu do Tuan tu 1 - Chuan bi ky thi va diem danh
autonumber
skinparam style strictuml
skinparam sequenceMessageAlign center

actor "Khao thi" as KhaoThi
actor "Giam thi" as GiamThi
participant "Cong Quan tri va Giam thi" as FE
participant "Dich vu Ca thi" as ExamSvc
participant "UMS" as UMS
database "CSDL Khao thi" as DB
participant "Dich vu Audit" as Audit

KhaoThi -> FE: createExamConfig(configData)
activate FE
FE -> ExamSvc: sendExamSchedule(scheduleData)
activate ExamSvc

ExamSvc -> UMS: fetchRegisteredStudents(examId)
activate UMS
UMS --> ExamSvc: studentList
deactivate UMS

ExamSvc -> DB: saveExamAndAssignments(examData)
activate DB
DB --> ExamSvc: saveSuccess
deactivate DB

ExamSvc -> Audit: logConfigChange(auditData)
activate Audit
Audit --> ExamSvc: logSuccess
deactivate Audit

ExamSvc --> FE: createSuccess
deactivate ExamSvc
FE --> KhaoThi: displaySuccessMessage()
deactivate FE

KhaoThi -> FE: assignInvigilatorAndOpenSession(sessionData)
activate FE
FE -> ExamSvc: updateRoomAssignmentAndOpen(sessionId)
activate ExamSvc

ExamSvc -> DB: saveAssignmentAndStatus(assignmentData, "OPEN")
activate DB
DB --> ExamSvc: updateSuccess
deactivate DB

ExamSvc -> Audit: logSessionOpened(auditData)
activate Audit
Audit --> ExamSvc: logSuccess
deactivate Audit

ExamSvc --> FE: sessionReady
deactivate ExamSvc
FE --> KhaoThi: displaySessionReady()
deactivate FE

GiamThi -> FE: openAssignedRoom(roomId)
activate FE
FE -> ExamSvc: getRoomMonitorAndAttendance(roomId)
activate ExamSvc

ExamSvc -> DB: getAssignmentAndRoster(roomId)
activate DB
DB --> ExamSvc: studentRoster
deactivate DB

ExamSvc --> FE: roomDetails
deactivate ExamSvc
FE --> GiamThi: displayRoom()
deactivate FE

GiamThi -> FE: markAttendance(studentId, status)
activate FE
FE -> ExamSvc: submitAttendance(attendanceData)
activate ExamSvc

ExamSvc -> DB: updateAttendanceAndAccess(attendanceData)
activate DB
DB --> ExamSvc: updateSuccess
deactivate DB

ExamSvc -> Audit: logAttendance(auditData)
activate Audit
Audit --> ExamSvc: logSuccess
deactivate Audit

ExamSvc --> FE: attendanceResult
deactivate ExamSvc
FE --> GiamThi: displayResult()
deactivate FE
@enduml
```

> **Ghi chú (từ review):** sequence này gộp khá nhiều việc (mở ca thi + điểm
> danh) nên hơi dài; chưa thể hiện rõ gán số báo danh/số máy thi, chưa có nhánh
> `Late`/`Violation`. Nếu triển khai chi tiết hơn, cân nhắc tách thành 2 sequence
> riêng (`Quản lý kỳ thi` và `Điểm danh phòng thi`) — xem mục 9.2.

## 3. Sequence - Sinh vien vao thi va lay de thi

Phu hop voi:
- FR-A, FR-B, FR-F, FR-P, FR-Q
- UC-001, UC-003, UC-006, UC-060

```plantuml
@startuml
title Bieu do Tuan tu 2 - Sinh vien vao thi va lay de thi
autonumber
skinparam style strictuml
skinparam sequenceMessageAlign center

actor "Sinh vien" as SV
participant "Cong Sinh vien" as FE
participant "API Xac thuc" as API
participant "SSO" as SSO
participant "Dich vu Lam bai" as AttemptSvc
participant "Adapter Loi thi" as ExamCore
database "CSDL Khao thi" as DB
participant "Dich vu Audit" as Audit

SV -> FE: login(ssoCredentials)
activate FE
FE -> API: authenticateAccount(ssoCredentials)
activate API

API -> SSO: verifyUserIdentity(ssoToken)
activate SSO
SSO --> API: userProfile, role
deactivate SSO

API -> DB: createOrUpdateUserProfile(userProfile)
activate DB
DB --> API: updateSuccess
deactivate DB

API -> Audit: logUserLogin(userId)
activate Audit
Audit --> API: logSuccess
deactivate Audit

API --> FE: accessToken, userDetails
deactivate API
FE --> SV: displayDashboard()
deactivate FE

SV -> FE: startExam(examId)
activate FE
FE -> AttemptSvc: initiateExamAttempt(examId, clientInfo)
activate AttemptSvc

AttemptSvc -> DB: getEligibilityData(examId, studentId)
activate DB
DB --> AttemptSvc: eligibilityData(session, attendance, maxAttempt, ipRange)
deactivate DB

alt Du dieu kien vao thi
    AttemptSvc -> DB: createOrResumeAttempt(examId, studentId)
    activate DB
    DB --> AttemptSvc: currentAttempt
    deactivate DB

    AttemptSvc -> ExamCore: getExamSnapshot(examId)
    activate ExamCore
    ExamCore --> AttemptSvc: examSnapshotData
    deactivate ExamCore

    AttemptSvc -> DB: saveAttemptState(snapshot, clientInfo)
    activate DB
    DB --> AttemptSvc: saveSuccess
    deactivate DB

    AttemptSvc -> Audit: logExamStarted(attemptId)
    activate Audit
    Audit --> AttemptSvc: logSuccess
    deactivate Audit

    AttemptSvc --> FE: attemptDetails(attemptId, startedAt)
    deactivate AttemptSvc

    FE -> AttemptSvc: fetchExamQuestions(attemptId)
    activate AttemptSvc
    AttemptSvc -> DB: getQuestionsSnapshot(attemptId)
    activate DB
    DB --> AttemptSvc: questionsWithAnswers
    deactivate DB

    AttemptSvc -> AttemptSvc: stripCorrectAnswers(questionsWithAnswers)
    AttemptSvc --> FE: safeQuestionList
    deactivate AttemptSvc

    FE --> SV: displayExamInterface()
    deactivate FE
else Khong du dieu kien
    AttemptSvc --> FE: accessDeniedError(reason)
    deactivate AttemptSvc
    FE --> SV: displayErrorMessage()
    deactivate FE
end
@enduml
```

> **Ghi chú (từ review):** chưa mô tả ngoại lệ `Exam Core timeout / không lấy
> được đề` (xem UC-064); nếu mở rộng thêm, nên thêm nhánh `alt Không lấy được đề
> thi`. Xem mục 9.2.

## 4. Sequence - Lam bai, auto save va recovery

Phu hop voi:
- FR-G, FR-H
- UC-016, UC-017, UC-062, UC-063
- US-055 -> US-061

```plantuml
@startuml
title Bieu do Tuan tu 3 - Lam bai, luu tu dong va phuc hoi du lieu
autonumber
skinparam style strictuml
skinparam sequenceMessageAlign center

actor "Sinh vien" as SV
participant "Cong Sinh vien" as FE
database "IndexedDB (Trinh duyet)" as LOCAL
participant "Dich vu Lam bai" as AttemptSvc
database "CSDL Khao thi" as DB

SV -> FE: selectAnswer(questionId, answerData)
activate FE
FE -> AttemptSvc: submitSingleAnswer(attemptId, answerData)
activate AttemptSvc

AttemptSvc -> DB: upsertAnswerRecord(answerData)
activate DB
DB --> AttemptSvc: saveSuccess
deactivate DB

AttemptSvc --> FE: ackSuccess
deactivate AttemptSvc
FE -> LOCAL: updateLocalState(answerData)
activate LOCAL
LOCAL --> FE: localSaveSuccess
deactivate LOCAL
FE --> SV: updateUI(savedStatus)
deactivate FE

loop Dinh ky moi 30 giay
    FE -> FE: triggerAutoSave()
    activate FE
    FE -> LOCAL: getCurrentState()
    activate LOCAL
    LOCAL --> FE: localAnswerSet
    deactivate LOCAL

    FE -> AttemptSvc: autoSaveAnswers(attemptId, localAnswerSet)
    activate AttemptSvc
    AttemptSvc -> DB: batchUpsertAnswers(answers, heartbeat)
    activate DB
    DB --> AttemptSvc: batchSaveSuccess
    deactivate DB
    AttemptSvc --> FE: autoSaveAck
    deactivate AttemptSvc
    deactivate FE
end

alt Mat ket noi mang
    FE -> FE: detectOfflineState()
    activate FE
    FE -> LOCAL: retainUnsyncedData()
    activate LOCAL
    LOCAL --> FE: retentionConfirmed
    deactivate LOCAL
    FE --> SV: displayOfflineWarning()
    deactivate FE
else Co mang tro lai / mo lai bai thi
    SV -> FE: resumeExam(attemptId)
    activate FE
    FE -> AttemptSvc: getServerAttemptState(attemptId)
    activate AttemptSvc

    AttemptSvc -> DB: fetchCurrentState(attemptId)
    activate DB
    DB --> AttemptSvc: serverState(answersSnapshot, remainingTime, attemptStatus)
    deactivate DB

    AttemptSvc --> FE: serverState(answersSnapshot, remainingTime, attemptStatus)
    deactivate AttemptSvc

    FE -> LOCAL: getUnsyncedLocalData()
    activate LOCAL
    LOCAL --> FE: unsyncedData
    deactivate LOCAL

    FE -> AttemptSvc: syncRecoveredData(unsyncedData)
    activate AttemptSvc
    note right of AttemptSvc
      Conflict Resolution:
      uu tien dap an co timestamp moi nhat
      giua server state va local state.
    end note

    AttemptSvc -> DB: resolveAndSyncData(resolvedData)
    activate DB
    DB --> AttemptSvc: syncSuccess
    deactivate DB

    AttemptSvc --> FE: recoverySuccessAck(answersSnapshot, remainingTime, attemptStatus)
    deactivate AttemptSvc
    FE --> SV: displayResumedExam(remainingTime, answersSnapshot, attemptStatus)
    deactivate FE
end
@enduml
```

> **Ghi chú (từ review):** đây là sequence sát định hướng dài hạn nhất; nếu mở
> rộng thêm nên bổ sung `reviewFlags` (câu đánh dấu xem lại) và nhánh `alt
> autosave fail -> queue local retry`. Xem mục 9.2.

## 5. Sequence - Nop bai, cham diem va xem ket qua

Phu hop voi:
- FR-J, FR-K, FR-L, FR-O
- UC-018, UC-019, UC-020, UC-046, UC-047

```plantuml
@startuml
title Bieu do Tuan tu 4 - Nop bai, cham diem va xem ket qua
autonumber
skinparam style strictuml
skinparam sequenceMessageAlign center

actor "Sinh vien" as SV
actor "Khao thi" as Officer
participant "Cong Sinh vien" as StudentUI
participant "Cong Quan tri va Giam thi" as AdminUI
participant "Dich vu Lam bai" as AttemptSvc
participant "He thong Cham diem" as Grader
database "CSDL Khao thi" as DB
participant "Dich vu Audit" as Audit

SV -> StudentUI: clickSubmit()
activate StudentUI
StudentUI -> StudentUI: calculateProgress()
StudentUI --> SV: displaySubmitConfirmation(progressInfo)
deactivate StudentUI

SV -> StudentUI: confirmSubmit()
activate StudentUI
StudentUI -> AttemptSvc: submitExamAttempt(attemptId)
activate AttemptSvc

AttemptSvc -> DB: lockAttemptAndAnswers(attemptId)
activate DB
DB --> AttemptSvc: lockSuccess
deactivate DB

AttemptSvc -> Grader: autoGradeAttempt(attemptId)
activate Grader
Grader -> DB: fetchGradingData(attemptId)
activate DB
DB --> Grader: gradingData(snapshot, answers, config)
deactivate DB
Grader --> AttemptSvc: gradingResult(score, correct, wrong)
deactivate Grader

AttemptSvc -> DB: saveFinalResult(gradingResult)
activate DB
DB --> AttemptSvc: saveSuccess
deactivate DB

AttemptSvc -> Audit: logExamSubmission(attemptId)
activate Audit
Audit --> AttemptSvc: logSuccess
deactivate Audit

AttemptSvc --> StudentUI: submitSuccessAck
deactivate AttemptSvc
deactivate StudentUI

alt Het gio lam bai (timer = 00:00 / timeout event)
    StudentUI -> StudentUI: detectExamTimeout()
    activate StudentUI
    StudentUI -> AttemptSvc: forceSubmitExamAttempt(attemptId)
    activate AttemptSvc

    AttemptSvc -> DB: lockAttemptAndAnswers(attemptId)
    activate DB
    DB --> AttemptSvc: lockSuccess
    deactivate DB

    AttemptSvc -> Grader: autoGradeAttempt(attemptId)
    activate Grader
    Grader -> DB: fetchGradingData(attemptId)
    activate DB
    DB --> Grader: gradingData(snapshot, answers, config)
    deactivate DB
    Grader --> AttemptSvc: gradingResult(score, correct, wrong)
    deactivate Grader

    AttemptSvc -> DB: saveFinalResult(gradingResult)
    activate DB
    DB --> AttemptSvc: saveSuccess
    deactivate DB

    AttemptSvc -> Audit: logAutoSubmission(attemptId)
    activate Audit
    Audit --> AttemptSvc: logSuccess
    deactivate Audit

    AttemptSvc --> StudentUI: autoSubmitSuccessAck
    deactivate AttemptSvc
    deactivate StudentUI
else Sinh vien chu dong nop bai
    note over StudentUI
      Luong nop bai thu cong da duoc mo ta
      o cac buoc phia tren.
    end note
end

StudentUI -> AttemptSvc: fetchExamResult(attemptId)
activate AttemptSvc
note right of AttemptSvc
  Mapping API Contract:
  GET /api/v1/results/{attemptId}
end note

AttemptSvc -> DB: fetchResultAndConfig(attemptId)
activate DB
DB --> AttemptSvc: resultAndConfig
deactivate DB

alt showResult = true
    AttemptSvc --> StudentUI: fullResultData
    StudentUI --> SV: displayDetailedResults()
else showResult = false
    AttemptSvc --> StudentUI: completionSummary
    StudentUI --> SV: displayCompletionMessage()
end
deactivate AttemptSvc

opt Khao thi cong bo / an ket qua hang loat
    Officer -> AdminUI: toggleResultVisibility(examId, isVisible)
    activate AdminUI
    AdminUI -> AttemptSvc: updateExamVisibility(examId, isVisible)
    activate AttemptSvc

    AttemptSvc -> DB: updateVisibilityFlag(examId, isVisible)
    activate DB
    DB --> AttemptSvc: updateSuccess
    deactivate DB

    AttemptSvc -> Audit: logVisibilityChange(examId)
    activate Audit
    Audit --> AttemptSvc: logSuccess
    deactivate Audit

    AttemptSvc --> AdminUI: updateSuccessAck
    deactivate AttemptSvc
    AdminUI --> Officer: displayUpdateSuccess()
    deactivate AdminUI
end
@enduml
```

> **Ghi chú (từ review):** endpoint xem kết quả trong sơ đồ dùng
> `GET /api/v1/results/{attemptId}`, khớp `08-api-contract.md`. Nếu code thực
> tế đã mở rộng sang endpoint khác (vd `/attempts/{id}/review`), cần cập nhật
> lại chú thích tại đây để tránh lệch giữa sequence và contract. Thiếu nhánh
> `submit fail / retry`, `grading fail` — xem mục 9.2.

## 6. Sequence - Giam sat phong thi va canh bao su co

Phu hop voi:
- FR-I, FR-M, FR-P
- UC-029 -> UC-035, UC-062, UC-066, UC-067

> **Ghi chú:** sequence này mô tả **mục tiêu nghiệp vụ mong muốn** nhiều hơn là
> trạng thái implementation đã ổn định — WebSocket/Invigilator Dashboard mới
> làm một phần (xem `16-traceability-matrix.md`). Nên gắn nhãn
> **target-state / Phase 2** khi trình bày trong báo cáo. Nhánh vi phạm bảo mật
> mô tả đúng bản chất "hệ thống tự phát hiện" (blur/tab-switch), không phải
> sinh viên tự khai báo.

```plantuml
@startuml
title Bieu do Tuan tu 5 - Giam sat phong thi va canh bao su co
autonumber
skinparam style strictuml
skinparam sequenceMessageAlign center

actor "Sinh vien" as SV
participant "Cong Sinh vien" as StudentUI
participant "Dich vu Tinh trang va Bao mat" as AttemptSvc
database "CSDL Khao thi" as DB
participant "API Giam sat" as MonitorAPI
participant "Cong WebSocket" as WS
participant "Cong Quan tri va Giam thi" as InvUI
actor "Giam thi" as Inv

Inv -> InvUI: openRoomDashboard(roomId)
activate InvUI
InvUI -> MonitorAPI: getRoomMonitorSnapshot(roomId)
activate MonitorAPI

MonitorAPI -> DB: fetchRoomState(roomId)
activate DB
DB --> MonitorAPI: roomStateData(attendance, attempts)
deactivate DB

MonitorAPI --> InvUI: monitorSnapshot
deactivate MonitorAPI

InvUI -> WS: connectRoomMonitorWS(roomId)
activate WS
WS --> InvUI: wsConnectionEstablished
deactivate WS
deactivate InvUI

SV -> StudentUI: performExamActivity()
activate StudentUI
StudentUI -> AttemptSvc: sendHeartbeatOrActivity(studentId, data)
activate AttemptSvc

AttemptSvc -> DB: updateStudentProgress(data)
activate DB
DB --> AttemptSvc: updateSuccess
deactivate DB

AttemptSvc -> WS: publishStatusChange(studentId, statusData)
activate WS
WS -> InvUI: pushStudentStatusUpdate(studentId, statusData)
activate InvUI
InvUI --> Inv: displayRealtimeUpdate()
deactivate InvUI
deactivate WS

AttemptSvc --> StudentUI: ackSuccess
deactivate AttemptSvc
deactivate StudentUI

alt Mat ket noi (missed heartbeat / timeout)
    AttemptSvc -> AttemptSvc: detectHeartbeatTimeout(studentId)
    activate AttemptSvc
    AttemptSvc -> WS: publishDisconnectAlert(studentId)
    activate WS
    WS -> InvUI: pushDisconnectWarning(studentId)
    activate InvUI
    InvUI --> Inv: displayRedWarning(studentId)
    deactivate InvUI
    deactivate WS
    deactivate AttemptSvc
else Vi pham bao mat (blur / visibilitychange / fullscreen exit)
    StudentUI -> StudentUI: detectBlurOrFullscreenExit()
    activate StudentUI
    StudentUI -> AttemptSvc: reportSecurityViolation(violationData)
    activate AttemptSvc

    AttemptSvc -> DB: logSecurityViolation(violationData)
    activate DB
    DB --> AttemptSvc: logSuccess
    deactivate DB

    AttemptSvc -> WS: publishSecurityAlert(studentId, violationType)
    activate WS
    WS -> InvUI: pushSecurityAlert(studentId, violationType)
    activate InvUI
    InvUI --> Inv: displayRedAlert()
    deactivate InvUI
    deactivate WS

    AttemptSvc --> StudentUI: ackReceived
    deactivate AttemptSvc
    deactivate StudentUI

    Inv -> InvUI: handleViolation(studentId, actionType)
    activate InvUI
    InvUI -> AttemptSvc: submitViolationRecord(recordData)
    activate AttemptSvc

    AttemptSvc -> DB: saveViolationRecord(recordData)
    activate DB
    DB --> AttemptSvc: saveSuccess
    deactivate DB

    AttemptSvc --> InvUI: recordSavedAck
    deactivate AttemptSvc
    InvUI --> Inv: updateDashboardUI()
    deactivate InvUI
end
@enduml
```

## 7. Goi y chen vao bao cao Word

- Muc `4. Tac nhan su dung` + `5. Mo ta nghiep vu tong quan`: dung so do `Use Case tong quan he thong`.
- Muc `5.1 Truoc khi thi`: dung `Sequence 1 - Chuan bi ky thi va diem danh`.
- Muc `5.2 Vao thi`: dung `Sequence 2 - Sinh vien vao thi va lay de`.
- Muc `5.3 Lam bai`: dung `Sequence 3 - Lam bai, auto save va recovery`.
- Muc `5.4 Nop va cham diem` + `5.6 Sau thi`: dung `Sequence 4 - Nop bai, cham diem va xem ket qua`.
- Muc `5.5 Giam sat`: dung `Sequence 5 - Giam sat phong thi va canh bao su co` (gắn nhãn target-state).

## 8. Ghi chu pham vi va trang thai implementation

- Bo so do nay uu tien pham vi MVP va dong bo voi SRS / API Contract.
- Use case `Lay de thi tu Exam Core` la luong he thong noi bo duoc kich hoat trong qua trinh sinh vien vao thi, khong phai thao tac nghiep vu do actor Khao thi thuc hien truc tiep.
- Cac thanh phan realtime monitoring, browser lockdown nang cao, audit log day du, va load testing quy mo lon van la cac khu vuc can tiep tuc hoan thien theo trang thai implementation hien tai.

---

## 9. Ghi chú review & định hướng tương lai

> Phần này rút gọn nội dung của 3 file review cũ (`22-nhan-xet-usecase-sequence.md`,
> `23-ok-che-usecase-sequence-tuong-lai.md`, `24-bao-cao-usecase-sequence-tuong-lai.md`).
> Mục đích: giữ lại các nhận xét còn giá trị tham khảo khi cần chỉnh sửa sâu hơn
> bộ use case/sequence ở trên, mà không cần mở 3 file riêng.

### 9.1. Đánh giá tổng quan

Use case và sequence ở Phần 1-6 đã ở mức **dùng tốt cho MVP/core business flow**:
sơ đồ dễ đọc, tách rõ Cổng Sinh viên / Cổng Quản trị-Giám thị, có ý thức mô tả
service layer, audit, DB, và các nhánh `alt/opt/loop`. Sequence 2, 3, 4 khá vững
và nên giữ lại nguyên trạng. Sequence 5 đúng hướng nhưng nên luôn gắn nhãn
**target-state / Phase 2** khi đưa vào báo cáo (xem `16-traceability-matrix.md`
về mức độ hoàn thiện thực tế của monitoring/WebSocket).

Các ảnh trong `docs/images/` (sequenceDiagram, usecaseDiagram, classDiagram) đã
khớp với bộ UML text này — **không cần xóa**, tiếp tục dùng cho báo cáo.

### 9.2. Bảng OK / Chưa ổn / Hướng chỉnh trong tương lai

| Hạng mục | OK | Chưa đủ / cần chỉnh trong tương lai |
|---|---|---|
| Use case tổng quan | 4 actor đúng SRS, use case vào thi đã gán đúng chủ thể (`Lấy đề` là luồng hệ thống, không gán cho Khảo thí) | Thiếu vài use case "năng lực hệ thống": auto-save/recovery, chấm điểm tự động, bảo mật phòng thi, đồng bộ lịch thi, gửi kết quả về hệ thống nguồn — nên bổ sung nếu mở rộng use case tổng quan |
| Sequence 1 — Chuẩn bị kỳ thi & điểm danh | Luồng Khảo thí → mở ca → Giám thị → điểm danh rõ ràng | Gộp khá nhiều việc trong 1 sequence; chưa rõ gán số máy thi/số báo danh; thiếu nhánh `Late`/`Violation` khi điểm danh |
| Sequence 2 — Vào thi & lấy đề | Đã tách đúng bản chất "lấy đề" là luồng hệ thống; có check eligibility | Login + bắt đầu thi nằm chung 1 sequence hơi dài; thiếu ngoại lệ "Exam Core timeout/không lấy được đề" (UC-064) |
| Sequence 3 — Auto-save & recovery | Thể hiện đủ 3 lớp UI/IndexedDB/Server; đã có `remainingTime`, `attemptStatus`, `answersSnapshot` khi recovery | Chưa có `reviewFlags` (câu đánh dấu xem lại); chưa có nhánh `alt autosave fail -> queue local retry` |
| Sequence 4 — Nộp bài, chấm điểm, kết quả | Đã có cả nhánh auto-submit khi hết giờ; đã chuẩn hoá theo `results/{attemptId}` | Chưa thể hiện `showAnswers`/`showExplanation` khi xem kết quả; chưa có ngoại lệ `submit fail`/`grading fail`/`retry` |
| Sequence 5 — Giám sát & cảnh báo | Đúng bản chất: vi phạm do client tự phát hiện (không phải SV tự khai báo); có heartbeat, disconnect, security alert | Nên gắn nhãn rõ **target-state/Phase 2**; thiếu payload minh hoạ cụ thể cho event WebSocket; chưa có ngưỡng vi phạm dẫn đến auto-lock |

### 9.3. Đối chiếu với `docs/thietkehethong.txt` (đã gộp vào `docs/29-uml-source-pack.md`)

`docs/thietkehethong.txt` mô tả kiến trúc auto-save/nộp bài theo hướng
**Redis Cache + Write-Behind Worker + Message Queue** (kiến trúc *mục tiêu/tương
lai* cho quy mô lớn), khác với sequence ở Phần 4-5 vốn lưu thẳng DB (kiến trúc
*hiện trạng* đang triển khai thực tế — xem `17-exam-core-integration.md`,
`15-test-report-wave2-trac-nghiem.md`). Đây **không phải mâu thuẫn**, mà là hai
tầng tài liệu khác nhau:
- Phần 1-6 của file này = bản nghiệp vụ / current-state để đối chiếu SRS, dùng
  báo cáo nghiệp vụ.
- `docs/thietkehethong.txt` (nay đã gộp vào `docs/29-uml-source-pack.md`, mục
  "Target Architecture") = kiến trúc tương lai/full-scale, dùng khi thiết kế
  giai đoạn mở rộng tải lớn (2.000 phiên đồng thời).

### 9.4. Thiếu sót của hệ thống hiện tại (đối chiếu `00-brief.md`, `16-traceability-matrix.md`)

| Thành phần | Trạng thái | Đánh giá |
|---|---|---|
| Real-time Monitoring / WebSocket | Chưa thật sự đầy đủ | Cần đầu tư tiếp nếu muốn demo phòng thi thuyết phục |
| Browser Lockdown | Mới ở mức cơ bản (IP + một phần detect) | Chưa đủ "phòng thi an toàn" mức cao (SEB, auto-lock theo ngưỡng) |
| Audit Log | Có khung nhưng chưa phủ đầy đủ mọi sự kiện nhạy cảm | Nên mô tả là "đang có nền tảng", chưa hoàn tất 100% |
| Exam Core / UMS integration | Còn adapter/mock/feature flag | Hợp lý cho dev; khi viết báo cáo nên tách rõ current-state và target-state |
| Load test / Integration test | Chưa đầy đủ | Điểm yếu lớn nếu hệ thống hướng tới 2.000 concurrent users |

### 9.5. Nếu chỉnh tiếp trong tương lai — thứ tự ưu tiên

1. Bổ sung nhánh `alt Exam Core timeout / không lấy được đề` vào Sequence 2.
2. Bổ sung `reviewFlags` + nhánh `autosave fail -> retry` vào Sequence 3.
3. Bổ sung `alt showAnswers/hideAnswers`, `submit fail/retry` vào Sequence 4.
4. Bổ sung ngưỡng vi phạm → auto-lock + payload WebSocket minh hoạ vào Sequence 5,
   và luôn gắn nhãn target-state khi trình bày.
5. Nếu mở rộng use case tổng quan: thêm nhóm use case "năng lực hệ thống" (mục 9.1).
