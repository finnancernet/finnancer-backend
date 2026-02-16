import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { SecurityModule } from './security/security.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { PlaidModule } from './plaid/plaid.module';
import { TransactionModule } from './transaction/transaction.module';
import { AccountModule } from './account/account.module';
import { BudgetModule } from './budget/budget.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { EmailModule } from './email/email.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    SecurityModule,
    AuthModule,
    UserModule,
    PlaidModule,
    TransactionModule,
    AccountModule,
    BudgetModule,
    SchedulerModule,
    EmailModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
