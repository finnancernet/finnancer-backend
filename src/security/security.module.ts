import { Module, Global } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { IPBlacklistService } from './ip-blacklist.service';
import { IPBlacklistGuard } from './guards/ip-blacklist.guard';
import { CustomThrottlerGuard } from './guards/custom-throttler.guard';

@Global()
@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ([
        {
          name: 'short',
          ttl: 1000, // 1 second
          limit: config.get('THROTTLE_SHORT_LIMIT') || 10,
        },
        {
          name: 'medium',
          ttl: 10000, // 10 seconds
          limit: config.get('THROTTLE_MEDIUM_LIMIT') || 20,
        },
        {
          name: 'long',
          ttl: 60000, // 1 minute
          limit: config.get('THROTTLE_LONG_LIMIT') || 100,
        },
      ]),
    }),
  ],
  providers: [
    IPBlacklistService,
    {
      provide: APP_GUARD,
      useClass: IPBlacklistGuard,
    },
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
  exports: [IPBlacklistService],
})
export class SecurityModule {}
