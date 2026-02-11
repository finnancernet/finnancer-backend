import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IPBlacklistService } from '../ip-blacklist.service';

@Injectable()
export class IPBlacklistGuard implements CanActivate {
  constructor(
    private ipBlacklistService: IPBlacklistService,
    private configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const ip = this.getClientIP(request);

    if (this.ipBlacklistService.isBlocked(ip)) {
      const blockedUntil = this.ipBlacklistService.getBlockedUntil(ip);
      throw new HttpException(
        {
          statusCode: HttpStatus.FORBIDDEN,
          message: 'Your IP has been temporarily blocked due to too many failed requests',
          blockedUntil: blockedUntil?.toISOString(),
        },
        HttpStatus.FORBIDDEN,
      );
    }

    return true;
  }

  private getClientIP(request: any): string {
    const trustProxy = this.configService.get('TRUST_PROXY') === 'true';

    // Only trust x-forwarded-for header if explicitly configured
    if (trustProxy) {
      const forwardedFor = request.headers['x-forwarded-for'];
      if (forwardedFor) {
        // Take the first IP in the chain (original client IP)
        return forwardedFor.split(',')[0].trim();
      }

      const realIp = request.headers['x-real-ip'];
      if (realIp) {
        return realIp.trim();
      }
    }

    // Default to connection IP (safe for non-proxy scenarios)
    return (
      request.ip ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      'unknown'
    );
  }
}
