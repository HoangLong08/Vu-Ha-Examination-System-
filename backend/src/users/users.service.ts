import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateUserDto,
  UpdateUserDto,
  UpdateUserActiveDto,
  AssignRolesDto,
  UserQueryDto,
} from './dto';
import { PageDto, PageMetaDto } from '../common/dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * GET /api/users — Paginated user list
   */
  async findAll(query: UserQueryDto): Promise<PageDto<any>> {
    const where: any = {};

    if (query.searchKey) {
      where.OR = [
        { fullName: { contains: query.searchKey, mode: 'insensitive' } },
        { email: { contains: query.searchKey, mode: 'insensitive' } },
      ];
    }

    if (query.isActive !== undefined) {
      where.status = query.isActive ? 'ACTIVE' : 'INACTIVE';
    }

    if (query.role) {
      where.userRoles = {
        some: {
          role: { code: query.role },
        },
      };
    }

    const [users, itemCount] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: { createdAt: query.order === 'ASC' ? 'asc' : 'desc' },
        include: {
          userRoles: {
            include: { role: true },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const data = users.map((u) => this.mapUserResponse(u));
    const meta = new PageMetaDto({ pageOptions: query, itemCount });

    return new PageDto(data, meta);
  }

  /**
   * GET /api/users/:id — User detail
   */
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.mapUserResponse(user);
  }

  /**
   * POST /api/users — Create user
   */
  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Email already exists');
    }

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        fullName: dto.fullName,
        username: dto.username || dto.email.split('@')[0],
        status: 'ACTIVE',
        userRoles: dto.roleIds
          ? {
              create: dto.roleIds.map((roleId) => ({ roleId })),
            }
          : undefined,
      },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });

    return this.mapUserResponse(user);
  }

  /**
   * PATCH /api/users/profile — Update own profile
   */
  async updateProfile(userId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.fullName && { fullName: dto.fullName }),
        ...(dto.avatar && { avatar: dto.avatar }),
        ...(dto.username && { username: dto.username }),
      },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });

    return this.mapUserResponse(user);
  }

  /**
   * PATCH /api/users/:id/active — Activate/deactivate
   */
  async updateActive(id: string, dto: UpdateUserActiveDto) {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        status: dto.isActive ? 'ACTIVE' : 'INACTIVE',
      },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });

    return this.mapUserResponse(user);
  }

  /**
   * POST /api/users/:id/roles — Assign roles
   */
  async assignRoles(userId: string, dto: AssignRolesDto) {
    // Delete existing roles and replace with new ones
    await this.prisma.userRole.deleteMany({
      where: { userId },
    });

    await this.prisma.userRole.createMany({
      data: dto.roleIds.map((roleId) => ({ userId, roleId })),
    });

    return this.findOne(userId);
  }

  /**
   * DELETE /api/users/:id — Soft delete
   */
  async remove(id: string) {
    await this.prisma.user.update({
      where: { id },
      data: { status: 'DELETED' },
    });

    return { message: 'User deleted successfully' };
  }

  private mapUserResponse(user: any) {
    return {
      id: user.id,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      role: 'USER',
      email: user.email,
      firstName: user.fullName?.split(' ').pop() || '',
      lastName: user.fullName?.split(' ').slice(0, -1).join(' ') || '',
      avatar: user.avatar,
      gender: null,
      roles:
        user.userRoles?.map((ur: any) => ({
          id: ur.role.id,
          name: ur.role.code,
          description: ur.role.name,
        })) || [],
      isActive: user.status === 'ACTIVE',
      lastLogin: user.lastLoginAt?.toISOString() || null,
      lastLoginIp: null,
    };
  }
}
