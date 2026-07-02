import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { DevLoginDto, LoginDto, RefreshTokenDto } from './dto';

@ApiTags('auth')
@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/auth/dev/yopmail-test-user
   * Dev-only login endpoint for test users.
   */
  @Post('auth/dev/yopmail-test-user')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng nhập dev cho người dùng test (yopmail)' })
  @ApiResponse({
    status: 200,
    description: 'Đăng nhập thành công, trả về token',
  })
  @ApiResponse({ status: 401, description: 'Thông tin đăng nhập không hợp lệ' })
  async devLogin(@Body() dto: DevLoginDto) {
    return this.authService.devLogin(dto.email);
  }

  /**
   * POST /api/auth/login — Đăng nhập email + mật khẩu.
   * Contract-first: mock (giả lập) khi chưa có API auth thật; gọi partner/login
   * thật khi cấu hình AUTH_SOURCE=partner + AUTH_PARTNER_BASE.
   */
  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng nhập bằng email và mật khẩu' })
  @ApiResponse({
    status: 200,
    description: 'Đăng nhập thành công, trả về token',
  })
  @ApiResponse({ status: 401, description: 'Sai tài khoản hoặc mật khẩu' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  /**
   * GET /api/v1/auth/me
   * Get current authenticated user info.
   */
  @Get('v1/auth/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thông tin người dùng đang đăng nhập' })
  @ApiResponse({ status: 200, description: 'Thông tin người dùng' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  async getMe(@Request() req: any) {
    return this.authService.getMe(req.user.id);
  }

  /**
   * POST /api/auth/refresh-token
   * Refresh access token.
   */
  @Post('auth/refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Làm mới access token' })
  @ApiResponse({ status: 200, description: 'Token đã được làm mới' })
  @ApiResponse({ status: 401, description: 'Refresh token không hợp lệ' })
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }
}
