import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PlaidService } from './plaid.service';
import { PlaidController } from './plaid.controller';
import { AccountModule } from '../account/account.module';
import { TransactionModule } from '../transaction/transaction.module';
import {
  SyncConfig,
  SyncConfigSchema,
} from '../scheduler/schemas/sync-config.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SyncConfig.name, schema: SyncConfigSchema },
    ]),
    AccountModule,
    TransactionModule,
  ],
  controllers: [PlaidController],
  providers: [PlaidService],
  exports: [PlaidService],
})
export class PlaidModule {}
