import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsDateString,
  IsBoolean,
  IsNumber,
  Min,
  Max,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class EssayGradeDto {
  @IsString()
  @IsNotEmpty()
  questionId: string;

  // Tín điểm 0..1 (1 = đạt tối đa cho câu này).
  @IsNumber()
  @Min(0)
  @Max(1)
  credit: number;
}

export class CheckDeviceDto {
  @IsBoolean()
  browserCompatible: boolean;

  @IsBoolean()
  audioFunctional: boolean;

  @IsBoolean()
  pingStable: boolean;
}

export class StartExamDto {
  @IsOptional()
  @IsString()
  clientIp?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;
}

export class SaveAnswerDto {
  // questionId là ID câu hỏi từ hệ thống đề (có thể không phải UUID nội bộ).
  @IsString()
  questionId: string;

  @IsString()
  answer: string;
}

export class AutoSaveAnswerItemDto {
  @IsString()
  questionId: string;

  @IsString()
  answer: string;

  @IsDateString()
  timestamp: string;
}

export class AutoSaveDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AutoSaveAnswerItemDto)
  answers: AutoSaveAnswerItemDto[];
}
