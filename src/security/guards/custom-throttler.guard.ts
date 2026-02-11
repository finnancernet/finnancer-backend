import { Injectable, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';
import { IPBlacklistService } from '../ip-blacklist.service';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  constructor(
    private ipBlacklistService: IPBlacklistService,
    private configService: ConfigService,
  ) {
    super(
      { throttlers: [] },
      { storage: new Map() } as any,
      { constructor: { name: 'Reflector' } } as any,
    );
  }

  protected async throwThrottlingException(
    context: ExecutionContext,
  ): Promise<void> {
    // When rate limit is exceeded, record a violation
    const request = context.switchToHttp().getRequest();
    const ip = this.getClientIP(request);

    this.ipBlacklistService.recordViolation(ip);
    throw new ThrottlerException();
  }

  protected async getTracker(req: Record<string, any>): Promise<string> {
    return this.getClientIP(req);
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
