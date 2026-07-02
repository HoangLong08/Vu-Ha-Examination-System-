import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateViolationDto {
  @IsUUID()
  studentId: string;

  @IsUUID()
  sessionId: string;

  @IsUUID()
  roomId: string;

  @IsOptional()
  @IsString()
  machineNumber?: string;

  @IsString()
  type: string; // TAB_SWITCH, SCREEN_EXIT, DEVICE_CHECK_FAIL, WINDOW_BLUR

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  recordedBy?: string;
}
