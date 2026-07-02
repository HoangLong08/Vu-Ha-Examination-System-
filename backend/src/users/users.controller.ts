import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import {
  CreateUserDto,
  UpdateUserDto,
  UpdateUserActiveDto,
  AssignRolesDto,
  UserQueryDto,
} from './dto';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * GET /api/users — Paginated user list
   */
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách người dùng (phân trang)' })
  @ApiResponse({ status: 200, description: 'Danh sách người dùng' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  findAll(@Query() query: UserQueryDto) {
    return this.usersService.findAll(query);
  }

  /**
   * GET /api/users/:id — User detail
   */
  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết người dùng theo ID' })
  @ApiParam({ name: 'id', description: 'ID người dùng (UUID)' })
  @ApiResponse({ status: 200, description: 'Chi tiết người dùng' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy người dùng' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  /**
   * POST /api/users — Create user
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'EXAM_OFFICER')
  @ApiOperation({ summary: 'Tạo mới người dùng' })
  @ApiResponse({ status: 201, description: 'Người dùng đã được tạo' })
  @ApiResponse({ status: 403, description: 'Không có quyền' })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  /**
   * PATCH /api/users/profile — Update own profile
   */
  @Patch('profile')
  @ApiOperation({ summary: 'Cập nhật hồ sơ cá nhân' })
  @ApiResponse({ status: 200, description: 'Hồ sơ đã được cập nhật' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  updateProfile(@Request() req: any, @Body() dto: UpdateUserDto) {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  /**
   * PATCH /api/users/:id/active — Activate/deactivate
   */
  @Patch(':id/active')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Kích hoạt/vô hiệu hóa người dùng' })
  @ApiParam({ name: 'id', description: 'ID người dùng (UUID)' })
  @ApiResponse({ status: 200, description: 'Trạng thái đã được cập nhật' })
  @ApiResponse({ status: 403, description: 'Không có quyền (ADMIN)' })
  updateActive(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserActiveDto,
  ) {
    return this.usersService.updateActive(id, dto);
  }

  /**
   * POST /api/users/:id/roles — Assign roles
   */
  @Post(':id/roles')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Gán vai trò cho người dùng' })
  @ApiParam({ name: 'id', description: 'ID người dùng (UUID)' })
  @ApiResponse({ status: 201, description: 'Vai trò đã được gán' })
  @ApiResponse({ status: 403, description: 'Không có quyền (ADMIN)' })
  assignRoles(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignRolesDto,
  ) {
    return this.usersService.assignRoles(id, dto);
  }

  /**
   * DELETE /api/users/:id — Soft delete
   */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Xóa mềm người dùng' })
  @ApiParam({ name: 'id', description: 'ID người dùng (UUID)' })
  @ApiResponse({ status: 200, description: 'Người dùng đã được xóa' })
  @ApiResponse({ status: 403, description: 'Không có quyền (ADMIN)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.remove(id);
  }
}
