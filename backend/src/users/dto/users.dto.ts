import {
  IsEmail,
  IsOptional,
  IsString,
  IsArray,
  IsUUID,
  IsBoolean,
} from 'class-validator';
import { PageOptionsDto } from '../../common/dto';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  fullName: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  roleIds?: string[];
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  username?: string;
}

export class UpdateUserActiveDto {
  @IsBoolean()
  isActive: boolean;
}

export class AssignRolesDto {
  @IsArray()
  @IsUUID('4', { each: true })
  roleIds: string[];
}

export class UserQueryDto extends PageOptionsDto {
  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  sortBy?: string;
}
