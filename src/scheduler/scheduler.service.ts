import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PlaidService } from '../plaid/plaid.service';
import { AccountService } from '../account/account.service';
import { TransactionService } from '../transaction/transaction.service';
import { SyncConfig, SyncConfigDocument } from './schemas/sync-config.schema';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    @InjectModel(SyncConfig.name)
    private syncConfigModel: Model<SyncConfigDocument>,
    private plaidService: PlaidService,
    private accountService: AccountService,
    private transactionService: TransactionService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleHourlySync() {
    this.logger.log('Starting hourly Plaid data synchronization');

    try {
      const syncConfigs = await this.syncConfigModel
        .find({ isActive: true })
        .exec();

      if (syncConfigs.length === 0) {
        this.logger.warn('No active sync configurations found');
        return;
      }

      this.logger.log(
        `Found ${syncConfigs.length} active sync configurations`,
      );

      for (const config of syncConfigs) {
        await this.syncItemData(config);
      }

      this.logger.log('Hourly synchronization completed successfully');
    } catch (error) {
      this.logger.error('Error during hourly synchronization', error);
    }
  }

  private async syncItemData(config: SyncConfigDocument) {
    try {
      this.logger.log(`Syncing data for item: ${config.itemId}`);

      // Sync accounts
      await this.syncAccounts(config);

      // Sync transactions
      await this.syncTransactions(config);

      // Update last synced timestamp
      config.lastSyncedAt = new Date();
      await config.save();

      this.logger.log(`Successfully synced data for item: ${config.itemId}`);
    } catch (error) {
      this.logger.error(`Error syncing item ${config.itemId}`, error);
    }
  }

  private async syncAccounts(config: SyncConfigDocument) {
    try {
      const accounts = await this.plaidService.getAccounts(config.accessToken);

      for (const account of accounts) {
        await this.accountService.upsertAccount({
          accountId: account.account_id,
          itemId: config.itemId,
          userId: config.userId,
          name: account.name,
          officialName: account.official_name || account.name,
          type: account.type,
          subtype: account.subtype || 'unknown',
          mask: account.mask || '',
          balances: {
            available: account.balances.available,
            current: account.balances.current,
            limit: account.balances.limit,
            isoCurrencyCode: account.balances.iso_currency_code,
            unofficialCurrencyCode: account.balances.unofficial_currency_code,
          },
          lastSyncedAt: new Date(),
        });
      }

      this.logger.log(
        `Synced ${accounts.length} accounts for item: ${config.itemId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error syncing accounts for item ${config.itemId}`,
        error,
      );
      throw error;
    }
  }

  private async syncTransactions(config: SyncConfigDocument) {
    try {
      let hasMore = true;
      let cursor = config.cursor;

      while (hasMore) {
        const syncResult = await this.plaidService.syncTransactions(
          config.accessToken,
          cursor,
        );

        // Process added transactions
        for (const transaction of syncResult.added) {
          await this.transactionService.upsertTransaction(
            this.mapPlaidTransaction(transaction),
          );
        }

        // Process modified transactions
        for (const transaction of syncResult.modified) {
          await this.transactionService.upsertTransaction(
            this.mapPlaidTransaction(transaction),
          );
        }

        // Process removed transactions
        for (const removed of syncResult.removed) {
          await this.transactionService.deleteTransaction(
            removed.transaction_id,
          );
        }

        this.logger.log(
          `Processed ${syncResult.added.length} added, ${syncResult.modified.length} modified, ${syncResult.removed.length} removed transactions`,
        );

        // Update cursor and check if there are more transactions
        cursor = syncResult.nextCursor;
        hasMore = syncResult.hasMore;

        // Save cursor to config
        config.cursor = cursor;
        await config.save();
      }

      this.logger.log(
        `Completed transaction sync for item: ${config.itemId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error syncing transactions for item ${config.itemId}`,
        error,
      );
      throw error;
    }
  }

  async addSyncConfig(
    userId: string,
    itemId: string,
    accessToken: string,
    institutionName?: string,
  ) {
    const config = new this.syncConfigModel({
      itemId,
      userId,
      accessToken,
      institutionName,
      isActive: true,
    });

    await config.save();
    this.logger.log(`Added sync configuration for item: ${itemId} (user: ${userId})`);
    return config;
  }

  async removeSyncConfig(itemId: string, userId: string) {
    await this.syncConfigModel.deleteOne({ itemId, userId }).exec();
    this.logger.log(`Removed sync configuration for item: ${itemId} (user: ${userId})`);
  }

  async getSyncConfigs() {
    return this.syncConfigModel.find().exec();
  }

  async getSyncConfigsByUser(userId: string) {
    return this.syncConfigModel.find({ userId }).exec();
  }

  private mapPlaidTransaction(transaction: any) {
    return {
      transactionId: transaction.transaction_id,
      accountId: transaction.account_id,
      amount: transaction.amount,
      isoCurrencyCode: transaction.iso_currency_code,
      unofficialCurrencyCode: transaction.unofficial_currency_code,
      category: transaction.category || [],
      categoryId: transaction.category_id,
      date: new Date(transaction.date),
      authorizedDate: transaction.authorized_date
        ? new Date(transaction.authorized_date)
        : null,
      name: transaction.name,
      merchantName: transaction.merchant_name,
      pending: transaction.pending,
      paymentChannel: transaction.payment_channel,
      personalFinanceCategory: transaction.personal_finance_category
        ? {
            primary: transaction.personal_finance_category.primary,
            detailed: transaction.personal_finance_category.detailed,
            confidenceLevel:
              transaction.personal_finance_category.confidence_level,
          }
        : undefined,
      location: transaction.location,
      paymentMeta: transaction.payment_meta,
      transactionType: transaction.transaction_type,
      originalDescription: transaction.original_description,
      merchantEntityId: transaction.merchant_entity_id,
      logoUrl: transaction.logo_url,
      website: transaction.website,
    };
  }
}
