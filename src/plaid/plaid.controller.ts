import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PlaidService } from './plaid.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../user/schemas/user.schema';
import { AccountService } from '../account/account.service';
import { TransactionService } from '../transaction/transaction.service';
import {
  SyncConfig,
  SyncConfigDocument,
} from '../scheduler/schemas/sync-config.schema';
import {
  Products,
  CountryCode,
  LinkTokenCreateRequest,
  ItemPublicTokenExchangeRequest,
} from 'plaid';

@Controller('plaid')
@UseGuards(JwtAuthGuard)
export class PlaidController {
  private readonly logger = new Logger(PlaidController.name);

  constructor(
    private readonly plaidService: PlaidService,
    private readonly accountService: AccountService,
    private readonly transactionService: TransactionService,
    @InjectModel(SyncConfig.name)
    private readonly syncConfigModel: Model<SyncConfigDocument>,
  ) {}

  @Get('create-link-token')
  async createLinkToken(@CurrentUser() user: User) {
    const userId = user['_id'].toString();

    const request: LinkTokenCreateRequest = {
      user: {
        client_user_id: userId,
      },
      client_name: 'Plaid Financcer',
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: 'en',
    };

    const response = await this.plaidService
      .getPlaidClient()
      .linkTokenCreate(request);

    return { link_token: response.data.link_token };
  }

  @Post('exchange-public-token')
  async exchangePublicToken(
    @Body() body: { public_token: string; metadata: any },
    @CurrentUser() user: User,
  ) {
    const userId = user['_id'].toString();
    const { public_token, metadata } = body;

    // Exchange public token for access token
    const request: ItemPublicTokenExchangeRequest = {
      public_token,
    };

    const response = await this.plaidService
      .getPlaidClient()
      .itemPublicTokenExchange(request);

    const accessToken = response.data.access_token;
    const itemId = response.data.item_id;

    // Save sync config
    const syncConfig = new this.syncConfigModel({
      itemId,
      userId,
      accessToken,
      institutionName: metadata.institution?.name,
      isActive: true,
    });
    await syncConfig.save();
    this.logger.log(`Saved sync config for item: ${itemId}`);

    // Fetch and save accounts
    const accounts = await this.plaidService.getAccounts(accessToken);

    for (const account of accounts) {
      await this.accountService.upsertAccount({
        accountId: account.account_id,
        itemId,
        userId,
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
    this.logger.log(`Saved ${accounts.length} accounts for item: ${itemId}`);

    // Initial transaction sync
    try {
      let hasMore = true;
      let cursor: string | undefined;
      let totalAdded = 0;

      while (hasMore) {
        const syncResult = await this.plaidService.syncTransactions(
          accessToken,
          cursor,
        );

        for (const transaction of syncResult.added) {
          await this.transactionService.upsertTransaction(
            this.mapPlaidTransaction(transaction),
          );
        }

        for (const transaction of syncResult.modified) {
          await this.transactionService.upsertTransaction(
            this.mapPlaidTransaction(transaction),
          );
        }

        for (const removed of syncResult.removed) {
          await this.transactionService.deleteTransaction(
            removed.transaction_id,
          );
        }

        totalAdded += syncResult.added.length;
        cursor = syncResult.nextCursor;
        hasMore = syncResult.hasMore;

        syncConfig.cursor = cursor;
        await syncConfig.save();
      }

      this.logger.log(
        `Initial sync: saved ${totalAdded} transactions for item: ${itemId}`,
      );
    } catch (error) {
      this.logger.warn(
        `Initial transaction sync failed for item ${itemId}, will retry on next scheduled sync`,
      );
    }

    return {
      success: true,
      itemId,
      institution: metadata.institution?.name,
      accounts: accounts.length,
    };
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
