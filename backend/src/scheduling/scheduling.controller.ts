import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';
import { SchedulingService } from './scheduling.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/constants/roles';

class CreateRoomDto {
  @IsString()
  @MinLength(1)
  code!: string;

  @IsString()
  @MinLength(1)
  name!: string;

  @IsInt()
  @Min(1)
  capacity!: number;

  @IsOptional()
  @IsString()
  location?: string;
}

class AssignDto {
  @IsUUID()
  roomId!: string;

  @IsUUID()
  invigilatorId!: string;
}

@ApiTags('scheduling')
@ApiBearerAuth()
@Controller('v1/scheduling')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.EXAM_OFFICER)
export class SchedulingController {
  constructor(private readonly scheduling: SchedulingService) {}

  @Get('sessions')
  @ApiOperation({ summary: 'Danh sách ca thi + phân công giám thị' })
  @ApiResponse({ status: 200, description: 'Danh sách ca thi' })
  listSessions() {
    return this.scheduling.listSessions();
  }

  @Get('rooms')
  @ApiOperation({ summary: 'Danh sách phòng thi' })
  listRooms() {
    return this.scheduling.listRooms();
  }

  @Post('rooms')
  @ApiOperation({ summary: 'Tạo phòng thi mới' })
  @ApiResponse({ status: 201, description: 'Đã tạo phòng' })
  createRoom(@Body() dto: CreateRoomDto) {
    return this.scheduling.createRoom(dto);
  }

  @Get('invigilators')
  @ApiOperation({ summary: 'Danh sách giám thị (để phân công)' })
  listInvigilators() {
    return this.scheduling.listInvigilators();
  }

  @Post('sessions/:sessionId/assign')
  @ApiOperation({ summary: 'Phân công giám thị vào phòng/ca' })
  @ApiResponse({ status: 201, description: 'Đã phân công' })
  assign(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() dto: AssignDto,
  ) {
    return this.scheduling.assignInvigilator(
      sessionId,
      dto.roomId,
      dto.invigilatorId,
    );
  }

  @Delete('assignments/:id')
  @ApiOperation({ summary: 'Gỡ phân công giám thị' })
  removeAssignment(@Param('id', ParseUUIDPipe) id: string) {
    return this.scheduling.removeAssignment(id);
  }
}
