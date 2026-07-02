import {
  IsString,
  IsOptional,
  IsInt,
  IsDateString,
  IsEnum,
  IsBoolean,
  Min,
} from 'class-validator';
import { PageOptionsDto } from '../../common/dto';

export enum ExamStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export class ExamConfigDto {
  // FR-L-003: cho phép sinh viên xem điểm sau khi nộp.
  @IsOptional()
  @IsBoolean()
  showResult?: boolean;

  // FR-Q-003: số lần thi tối đa.
  @IsOptional()
  @IsInt()
  @Min(1)
  maxAttempt?: number;

  // FR-Q-001: trộn thứ tự câu hỏi.
  @IsOptional()
  @IsBoolean()
  shuffleQuestions?: boolean;

  // FR-Q-002: trộn thứ tự đáp án.
  @IsOptional()
  @IsBoolean()
  shuffleAnswers?: boolean;

  // EPIC-21: liên kết đề với nguồn exam-core (KT&ĐBCL).
  // examCoreMatrixId được ưu tiên (rút theo ma trận); không có thì dùng bank.
  // Chuỗi rỗng "" => gỡ liên kết (đặt về null).
  @IsOptional()
  @IsString()
  examCoreBankId?: string;

  @IsOptional()
  @IsString()
  examCoreMatrixId?: string;
}

export class CreateExamDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsString()
  academicYear: string;

  @IsString()
  semester: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}

export class UpdateExamDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(ExamStatus)
  status?: ExamStatus;
}

export class ExamQueryDto extends PageOptionsDto {
  @IsOptional()
  @IsString()
  academicYear?: string;

  @IsOptional()
  @IsString()
  semester?: string;

  @IsOptional()
  @IsEnum(ExamStatus)
  status?: ExamStatus;
}

export class CreateExamDefinitionDto {
  @IsOptional()
  @IsString()
  externalExamId?: string;

  @IsString()
  code: string;

  @IsString()
  title: string;

  @IsInt()
  @Min(1)
  durationMinutes: number;

  @IsInt()
  @Min(1)
  totalQuestions: number;

  @IsOptional()
  @IsString()
  sourceSystem?: string;
}
