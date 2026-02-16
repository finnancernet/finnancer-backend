import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SchedulerService } from './scheduler.service';
import { EmailSchedulerService } from './email-scheduler.service';
import { SchedulerController } from './scheduler.controller';
import { SyncConfig, SyncConfigSchema } from './schemas/sync-config.schema';
import { Account, AccountSchema } from '../account/schemas/account.schema';
import {
  Transaction,
  TransactionSchema,
} from '../transaction/schemas/transaction.schema';
import { PlaidModule } from '../plaid/plaid.module';
import { AccountModule } from '../account/account.module';
import { TransactionModule } from '../transaction/transaction.module';
import { EmailModule } from '../email/email.module';
import { BudgetModule } from '../budget/budget.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SyncConfig.name, schema: SyncConfigSchema },
      { name: Account.name, schema: AccountSchema },
      { name: Transaction.name, schema: TransactionSchema },
    ]),
    PlaidModule,
    AccountModule,
    TransactionModule,
    EmailModule,
    BudgetModule,
  ],
  controllers: [SchedulerController],
  providers: [SchedulerService, EmailSchedulerService],
  exports: [SchedulerService, EmailSchedulerService],
})
export class SchedulerModule {}
