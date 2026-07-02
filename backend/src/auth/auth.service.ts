import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { LoginPayloadDto, TokenPayloadDto } from './dto';
import { Role, ROLE_NAMES } from '../common/constants/roles';
import { simulateFullName } from './auth.names';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Dev-only login: Creates or fetches a test user by email and issues tokens.
   * Endpoint: POST /api/auth/dev/yopmail-test-user
   */
  /** Suy ra MÃ vai trò CHUẨN từ email dev (xem common/constants/roles). */
  private resolveRoleCode(email: string): Role {
    const e = email.toLowerCase();
    if (e.includes('invigilator') || e.includes('giamthi'))
      return Role.INVIGILATOR;
    if (
      e.includes('officer') ||
      e.includes('khaothi') ||
      e.includes('examofficer')
    )
      return Role.EXAM_OFFICER;
    if (e.includes('admin')) return Role.ADMIN;
    return Role.STUDENT;
  }

  async devLogin(email: string): Promise<LoginPayloadDto> {
    const roleCode = this.resolveRoleCode(email);
    // Đảm bảo Role chuẩn tồn tại.
    const role = await this.prisma.role.upsert({
      where: { code: roleCode },
      update: {},
      create: { code: roleCode, name: ROLE_NAMES[roleCode] },
    });

    const include = { userRoles: { include: { role: true } } };
    let user = await this.prisma.user.findUnique({ where: { email }, include });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          fullName: simulateFullName(email), // tên Việt giả lập cho tài khoản test
          username: email.split('@')[0],
          status: 'ACTIVE',
          userRoles: { create: { roleId: role.id } },
        },
        include,
      });
    } else {
      // Tự ĐỒNG BỘ về đúng 1 vai trò chuẩn theo email (dọn vai trò cũ/lệch).
      const hasExact =
        user.userRoles.length === 1 && user.userRoles[0].role.code === roleCode;
      if (!hasExact) {
        await this.prisma.userRole.deleteMany({ where: { userId: user.id } });
        await this.prisma.userRole.create({
          data: { userId: user.id, roleId: role.id },
        });
        user = await this.prisma.user.findUnique({
          where: { id: user.id },
          include,
        });
      }
    }

    if (!user) throw new UnauthorizedException('User not found');

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const roles = user.userRoles.map((ur) => ur.role.code);
    const tokens = this.generateTokens(user.id, user.email, roles);

    const student = await this.prisma.student.findFirst({
      where: { email: user.email },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.fullName.split(' ').pop() || '',
        lastName: user.fullName.split(' ').slice(0, -1).join(' ') || '',
        avatar: user.avatar,
        gender: null,
        role: 'USER',
        roles: roles,
        isActive: user.status === 'ACTIVE',
        lastLogin: user.lastLoginAt?.toISOString() || null,
        lastLoginIp: null,
        studentInfo: student
          ? {
              studentCode: student.studentCode,
              className: student.className,
              facultyName: student.facultyName,
            }
          : null,
      },
      token: tokens,
    };
  }

  /**
   * Đăng nhập email + mật khẩu — CONTRACT-FIRST giống exam-core.
   *   - AUTH_SOURCE=partner + AUTH_PARTNER_BASE  -> gọi API auth THẬT (coregenaihub)
   *   - còn lại (mặc định)                        -> GIẢ LẬP (mock) qua devLogin,
   *     bỏ qua mật khẩu, tự sinh tên Việt (xem auth.names).
   * Trả cùng kiểu LoginPayloadDto nên FE không phải đổi.
   */
  async login(email: string, password: string): Promise<LoginPayloadDto> {
    const usePartner =
      this.configService.get<string>('AUTH_SOURCE') === 'partner' &&
      !!this.configService.get<string>('AUTH_PARTNER_BASE');
    if (usePartner) return this.partnerLogin(email, password);
    return this.devLogin(email); // mock: tài khoản/tên giả lập
  }

  /**
   * Xác thực qua API partner THẬT rồi PHÁT token nội bộ (proxy). Bật khi có
   * AUTH_PARTNER_BASE. Hợp đồng: POST {base}/api/auth/partner/login {email,password}
   * -> { data: { user, token } } (xem docs/18-auth-integration.md).
   */
  private async partnerLogin(
    email: string,
    password: string,
  ): Promise<LoginPayloadDto> {
    const base = (
      this.configService.get<string>('AUTH_PARTNER_BASE') ?? ''
    ).replace(/\/+$/, '');
    const res = await fetch(`${base}/api/auth/partner/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      throw new UnauthorizedException('Sai tài khoản hoặc mật khẩu');
    }
    const body = (await res.json()) as { data?: { user?: { email?: string } } };
    const partnerEmail = body?.data?.user?.email ?? email;
    // Provision user nội bộ + phát JWT của hệ thi để guard hoạt động.
    return this.devLogin(partnerEmail);
  }

  /**
   * Get current user info from JWT token.
   * Endpoint: GET /api/v1/auth/me
   */
  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const student = await this.prisma.student.findFirst({
      where: { email: user.email },
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.fullName.split(' ').pop() || '',
      lastName: user.fullName.split(' ').slice(0, -1).join(' ') || '',
      avatar: user.avatar,
      gender: null,
      role: 'USER',
      roles: user.userRoles.map((ur) => ur.role.code),
      isActive: user.status === 'ACTIVE',
      lastLogin: user.lastLoginAt?.toISOString() || null,
      lastLoginIp: null,
      studentInfo: student
        ? {
            studentCode: student.studentCode,
            className: student.className,
            facultyName: student.facultyName,
          }
        : null,
    };
  }

  /**
   * Refresh access token using refresh token.
   * Endpoint: POST /api/auth/refresh-token
   */
  async refreshToken(refreshToken: string): Promise<TokenPayloadDto> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          userRoles: {
            include: { role: true },
          },
        },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const roles = user.userRoles.map((ur) => ur.role.code);
      return this.generateTokens(user.id, user.email, roles);
    } catch (error) {
      this.logger.error('Refresh token validation failed', error);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  private generateTokens(
    userId: string,
    email: string,
    roles: string[],
  ): TokenPayloadDto {
    // env trả CHUỖI — phải Number() thật, nếu không jsonwebtoken/ms hiểu "3600"
    // là 3600ms (≈3s) thay vì 3600s -> token hết hạn ngay.
    const expiresIn =
      Number(this.configService.get('JWT_EXPIRATION', 3600)) || 3600;
    const refreshExpiresIn =
      Number(this.configService.get('JWT_REFRESH_EXPIRATION', 604800)) ||
      604800;

    const accessToken = this.jwtService.sign(
      { sub: userId, email, roles },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn,
      },
    );

    const refreshToken = this.jwtService.sign(
      { sub: userId, type: 'refresh' },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: refreshExpiresIn,
      },
    );

    return { expiresIn, accessToken, refreshToken };
  }
}
