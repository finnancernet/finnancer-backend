import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email/email.service';

const MONGO_STATES: Record<number, string> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

@Controller()
export class AppController {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  getStatus() {
    return {
      status: 'running',
      message: 'Plaid Finnancer API is running',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health/diagnostic')
  async getDiagnostic() {
    const checks: Record<string, { status: string; message?: string }> = {};

    // API check
    checks.api = { status: 'ok', message: 'API is responding' };

    // MongoDB check
    try {
      const readyState = this.connection.readyState;
      if (readyState === 1) {
        checks.mongodb = { status: 'ok', message: 'Connected' };
      } else {
        checks.mongodb = {
          status: 'error',
          message: `State: ${MONGO_STATES[readyState] || 'unknown'}`,
        };
      }
    } catch (error: any) {
      checks.mongodb = {
        status: 'error',
        message: error.message || 'Failed to check MongoDB connection',
      };
    }

    // Email check
    try {
      const smtpOk = await this.emailService.verifyConnection();
      if (!smtpOk) {
        checks.email = { status: 'error', message: 'SMTP connection failed' };
      } else {
        const emailFrom = this.configService.get<string>('EMAIL_FROM');
        const sent = await this.emailService.sendEmail({
          to: emailFrom,
          subject: 'Finnancer Health Check',
          html: `<p>Health diagnostic ran successfully at <strong>${new Date().toISOString()}</strong>.</p>`,
        });
        checks.email = sent
          ? { status: 'ok', message: `Test email sent to ${emailFrom}` }
          : { status: 'error', message: 'SMTP verified but email send failed' };
      }
    } catch (error: any) {
      checks.email = {
        status: 'error',
        message: error.message || 'Email check failed',
      };
    }

    // Overall status
    const mongoOk = checks.mongodb.status === 'ok';
    const emailOk = checks.email.status === 'ok';
    let status = 'ok';
    if (!mongoOk) status = 'error';
    else if (!emailOk) status = 'degraded';

    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks,
    };
  }
}
