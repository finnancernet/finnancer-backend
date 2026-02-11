import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
  AccountsGetRequest,
  TransactionsGetRequest,
  TransactionsSyncRequest,
} from 'plaid';

@Injectable()
export class PlaidService {
  private readonly logger = new Logger(PlaidService.name);
  private plaidClient: PlaidApi;

  constructor(private configService: ConfigService) {
    const plaidEnv = this.configService.get('PLAID_ENV');
    const clientId = this.configService.get('PLAID_CLIENT_ID');
    const basePath = PlaidEnvironments[plaidEnv];

    this.logger.log(
      `Plaid config: env=${plaidEnv}, basePath=${basePath}, clientId=${clientId ? clientId.substring(0, 6) + '...' : 'MISSING'}`,
    );

    const configuration = new Configuration({
      basePath,
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': clientId,
          'PLAID-SECRET': this.configService.get('PLAID_SECRET'),
          'Plaid-Version': this.configService.get('PLAID_API_VERSION'),
        },
      },
    });

    this.plaidClient = new PlaidApi(configuration);
    this.logger.log('Plaid client initialized');
  }

  private handlePlaidError(error: any, context: string): never {
    const plaidError = error?.response?.data;
    if (plaidError) {
      this.logger.error(
        `Plaid API error in ${context}: [${plaidError.error_type}] ${plaidError.error_code} - ${plaidError.error_message}`,
      );
      throw new HttpException(
        {
          message: plaidError.error_message || 'Plaid API error',
          error_code: plaidError.error_code,
          error_type: plaidError.error_type,
        },
        plaidError.status_code || HttpStatus.BAD_REQUEST,
      );
    }
    this.logger.error(`Error in ${context}`, error);
    throw error;
  }

  async getAccounts(accessToken: string) {
    try {
      const request: AccountsGetRequest = {
        access_token: accessToken,
      };

      const response = await this.plaidClient.accountsGet(request);
      this.logger.log(`Fetched ${response.data.accounts.length} accounts`);
      return response.data.accounts;
    } catch (error) {
      this.handlePlaidError(error, 'getAccounts');
    }
  }

  async getTransactions(
    accessToken: string,
    startDate: string,
    endDate: string,
  ) {
    try {
      const request: TransactionsGetRequest = {
        access_token: accessToken,
        start_date: startDate,
        end_date: endDate,
      };

      const response = await this.plaidClient.transactionsGet(request);
      let transactions = response.data.transactions;
      const totalTransactions = response.data.total_transactions;

      // Paginate if there are more transactions
      while (transactions.length < totalTransactions) {
        const paginatedRequest: TransactionsGetRequest = {
          access_token: accessToken,
          start_date: startDate,
          end_date: endDate,
          options: {
            offset: transactions.length,
          },
        };
        const paginatedResponse =
          await this.plaidClient.transactionsGet(paginatedRequest);
        transactions = transactions.concat(paginatedResponse.data.transactions);
      }

      this.logger.log(`Fetched ${transactions.length} transactions`);
      return transactions;
    } catch (error) {
      this.handlePlaidError(error, 'getTransactions');
    }
  }

  async syncTransactions(accessToken: string, cursor?: string) {
    try {
      const request: TransactionsSyncRequest = {
        access_token: accessToken,
        cursor: cursor,
      };

      const response = await this.plaidClient.transactionsSync(request);

      this.logger.log(
        `Synced ${response.data.added.length} added, ${response.data.modified.length} modified, ${response.data.removed.length} removed transactions`,
      );

      return {
        added: response.data.added,
        modified: response.data.modified,
        removed: response.data.removed,
        nextCursor: response.data.next_cursor,
        hasMore: response.data.has_more,
      };
    } catch (error) {
      this.handlePlaidError(error, 'syncTransactions');
    }
  }

  getPlaidClient(): PlaidApi {
    return this.plaidClient;
  }
}
