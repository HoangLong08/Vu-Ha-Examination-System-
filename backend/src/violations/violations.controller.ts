import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { ViolationsService } from './violations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateViolationDto } from './dto';

@ApiTags('violations')
@ApiBearerAuth()
@Controller('v1/violations')
@UseGuards(JwtAuthGuard)
export class ViolationsController {
  constructor(private readonly violationsService: ViolationsService) {}

  /**
   * POST /api/v1/violations — Record a violation
   */
  @Post()
  @ApiOperation({ summary: 'Ghi nhận một vi phạm trong ca thi' })
  @ApiResponse({ status: 201, description: 'Vi phạm đã được ghi nhận' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  create(@Body() dto: CreateViolationDto) {
    return this.violationsService.create(dto);
  }

  /**
   * GET /api/v1/violations?sessionId=... — Get violations by session
   */
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách vi phạm theo ca thi' })
  @ApiResponse({ status: 200, description: 'Danh sách vi phạm' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  findBySession(@Query('sessionId') sessionId: string) {
    return this.violationsService.findBySession(sessionId);
  }

  /**
   * POST /api/v1/violations/:id/attachments — Upload attachment
   */
  @Post(':id/attachments')
  @ApiOperation({ summary: 'Đính kèm tệp bằng chứng cho vi phạm' })
  @ApiParam({ name: 'id', description: 'ID vi phạm (UUID)' })
  @ApiResponse({ status: 201, description: 'Đã đính kèm tệp' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  addAttachment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { fileName: string; fileUrl: string },
  ) {
    return this.violationsService.addAttachment(
      id,
      body.fileName,
      body.fileUrl,
    );
  }
}
