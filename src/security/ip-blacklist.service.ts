import { Injectable, Logger } from '@nestjs/common';

interface IPRecord {
  violations: number;
  firstViolation: Date;
  lastViolation: Date;
  blockedUntil?: Date;
}

@Injectable()
export class IPBlacklistService {
  private readonly logger = new Logger(IPBlacklistService.name);
  private readonly ipRecords = new Map<string, IPRecord>();
  private readonly blockedIPs = new Set<string>();

  // Configuration
  private readonly MAX_VIOLATIONS = 10; // Max violations before blocking
  private readonly VIOLATION_WINDOW = 15 * 60 * 1000; // 15 minutes
  private readonly BLOCK_DURATION = 60 * 60 * 1000; // 1 hour
  private readonly CLEANUP_INTERVAL = 10 * 60 * 1000; // 10 minutes

  constructor() {
    // Start cleanup interval
    setInterval(() => this.cleanup(), this.CLEANUP_INTERVAL);
  }

  recordViolation(ip: string): void {
    const now = new Date();
    const record = this.ipRecords.get(ip);

    if (!record) {
      this.ipRecords.set(ip, {
        violations: 1,
        firstViolation: now,
        lastViolation: now,
      });
      return;
    }

    // Check if we should reset the violation count (outside time window)
    if (
      now.getTime() - record.firstViolation.getTime() >
      this.VIOLATION_WINDOW
    ) {
      record.violations = 1;
      record.firstViolation = now;
      record.lastViolation = now;
    } else {
      record.violations++;
      record.lastViolation = now;

      // Block IP if too many violations
      if (record.violations >= this.MAX_VIOLATIONS) {
        this.blockIP(ip);
      }
    }
  }

  blockIP(ip: string): void {
    const now = new Date();
    const blockedUntil = new Date(now.getTime() + this.BLOCK_DURATION);

    const record = this.ipRecords.get(ip);
    if (record) {
      record.blockedUntil = blockedUntil;
    }

    this.blockedIPs.add(ip);
    this.logger.warn(`IP ${ip} has been blocked until ${blockedUntil.toISOString()}`);
  }

  unblockIP(ip: string): void {
    this.blockedIPs.delete(ip);
    const record = this.ipRecords.get(ip);
    if (record) {
      delete record.blockedUntil;
    }
    this.logger.log(`IP ${ip} has been unblocked`);
  }

  isBlocked(ip: string): boolean {
    if (!this.blockedIPs.has(ip)) {
      return false;
    }

    const record = this.ipRecords.get(ip);
    if (!record || !record.blockedUntil) {
      return false;
    }

    // Check if block has expired
    if (new Date() > record.blockedUntil) {
      this.unblockIP(ip);
      return false;
    }

    return true;
  }

  getBlockedUntil(ip: string): Date | null {
    const record = this.ipRecords.get(ip);
    return record?.blockedUntil || null;
  }

  getViolationCount(ip: string): number {
    return this.ipRecords.get(ip)?.violations || 0;
  }

  getAllBlockedIPs(): string[] {
    return Array.from(this.blockedIPs);
  }

  private cleanup(): void {
    const now = new Date();
    let cleanedCount = 0;

    for (const [ip, record] of this.ipRecords.entries()) {
      // Remove expired blocks
      if (record.blockedUntil && now > record.blockedUntil) {
        this.unblockIP(ip);
        cleanedCount++;
      }

      // Remove old violation records (older than window)
      if (
        !record.blockedUntil &&
        now.getTime() - record.lastViolation.getTime() > this.VIOLATION_WINDOW
      ) {
        this.ipRecords.delete(ip);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.debug(`Cleaned up ${cleanedCount} IP records`);
    }
  }
}
