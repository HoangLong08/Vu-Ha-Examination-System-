import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import ipRangeCheck from 'ip-range-check';

@Injectable()
export class IpRangeGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    let clientIp =
      request.headers['x-forwarded-for'] || request.socket.remoteAddress;

    // Normalize IPv6 loopback to IPv4
    if (clientIp === '::1' || clientIp === '::ffff:127.0.0.1') {
      clientIp = '127.0.0.1';
    }

    // If x-forwarded-for has multiple IPs, take the first
    if (typeof clientIp === 'string' && clientIp.includes(',')) {
      clientIp = clientIp.split(',')[0].trim();
    }

    const rangesStr =
      this.configService.get<string>('ALLOWED_IP_RANGES') || '127.0.0.1';
    const allowedRanges = rangesStr.split(',').map((r) => r.trim());

    const isIpAllowed = ipRangeCheck(clientIp, allowedRanges);
    if (!isIpAllowed) {
      throw new ForbiddenException(
        `IP ${clientIp} is not within allowed lab IP ranges.`,
      );
    }

    return true;
  }
}
