/**
 * Bộ MÃ VAI TRÒ CHUẨN của hệ thống (4 actor — xem docs/04-use-cases §Actor).
 * Dùng THỐNG NHẤT ở dev-login, guards, @Roles, service. KHÔNG dùng mã khác
 * (EXAMINER / EXAMINATION_OFFICER / SYSTEM_ADMIN đã loại bỏ).
 */
export enum Role {
  STUDENT = 'STUDENT',
  INVIGILATOR = 'INVIGILATOR',
  EXAM_OFFICER = 'EXAM_OFFICER', // Khảo thí (Examination Officer)
  ADMIN = 'ADMIN', // Quản trị hệ thống (Administrator)
}

/** Vai trò nhân sự khảo thí: xem mọi kết quả, công bố, cấu hình đề. */
export const STAFF_ROLES: Role[] = [Role.ADMIN, Role.EXAM_OFFICER];

/** Tên hiển thị tiếng Việt cho từng mã. */
export const ROLE_NAMES: Record<Role, string> = {
  [Role.STUDENT]: 'Sinh viên',
  [Role.INVIGILATOR]: 'Cán bộ coi thi',
  [Role.EXAM_OFFICER]: 'Khảo thí',
  [Role.ADMIN]: 'Quản trị hệ thống',
};
