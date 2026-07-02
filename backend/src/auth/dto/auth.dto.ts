import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class DevLoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsOptional()
  @IsString()
  password?: string;
}

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class TokenPayloadDto {
  expiresIn: number;
  accessToken: string;
  refreshToken: string;
}

export class LoginPayloadDto {
  user: UserPayloadDto;
  token: TokenPayloadDto;
}

export class UserPayloadDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  gender: string | null;
  role: string;
  roles: any[];
  studentInfo?: any;
  isActive: boolean;
  lastLogin: string | null;
  lastLoginIp: string | null;
}

export class RolePayloadDto {
  id: string;
  name: string;
  description?: string;
  isSystem?: boolean;
  permissions?: PermissionPayloadDto[];
}

export class PermissionPayloadDto {
  id: string;
  module: string;
  name: string;
  description?: string;
}
