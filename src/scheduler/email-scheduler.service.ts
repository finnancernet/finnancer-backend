import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Account, AccountDocument } from '../account/schemas/account.schema';
import {
  Transaction,
  TransactionDocument,
} from '../transaction/schemas/transaction.schema';
import { EmailService } from '../email/email.service';
import { TransactionSummaryTemplate } from '../email/templates/transaction-summary.template';

@Injectable()
export class EmailSchedulerService {
  private readonly logger = new Logger(EmailSchedulerService.name);

  constructor(
    @InjectModel(Account.name) private accountModel: Model<AccountDocument>,
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async sendDailyTransactionSummary() {
    const isEnabled = this.configService.get<string>(
      'EMAIL_DAILY_SUMMARY_ENABLED',
    );

    if (isEnabled !== 'true') {
      this.logger.log('Daily email summary is disabled in configuration');
      return;
    }

    this.logger.log('Starting daily transaction summary email job');

    try {
      // Get all accounts that have email configured and want to receive summaries
      const accounts = await this.accountModel
        .find({
          email: { $exists: true, $ne: '' },
          receiveEmailSummary: true,
          isActive: true,
        })
        .exec();

      if (accounts.length === 0) {
        this.logger.warn('No accounts configured to receive email summaries');
        return;
      }

      this.logger.log(
        `Found ${accounts.length} accounts to send summaries to`,
      );

      // Get yesterday's date range
      const { startDate, endDate } = this.getYesterdayDateRange();

      for (const account of accounts) {
        await this.sendAccountSummary(account, startDate, endDate);
      }

      this.logger.log('Daily transaction summary emails sent successfully');
    } catch (error) {
      this.logger.error('Error sending daily transaction summaries', error);
    }
  }

  private async sendAccountSummary(
    account: Account,
    startDate: Date,
    endDate: Date,
  ) {
    try {
      this.logger.log(
        `Processing account: ${account.accountId} (${account.email})`,
      );

      // Get transactions for yesterday
      const transactions = await this.transactionModel
        .find({
          accountId: account.accountId,
          date: {
            $gte: startDate,
            $lt: endDate,
          },
        })
        .sort({ date: -1 })
        .exec();

      this.logger.log(
        `Found ${transactions.length} transactions for account ${account.accountId}`,
      );

      // Generate email HTML
      const emailHtml = TransactionSummaryTemplate.generate(
        account,
        transactions,
        startDate,
      );

      const subject = `Daily Transaction Summary - ${startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;

      // Send email
      const sent = await this.emailService.sendEmail({
        to: account.email,
        subject,
        html: emailHtml,
      });

      if (sent) {
        this.logger.log(
          `Successfully sent email to ${account.email} for account ${account.accountId}`,
        );
      } else {
        this.logger.error(
          `Failed to send email to ${account.email} for account ${account.accountId}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error processing account ${account.accountId}`,
        error,
      );
    }
  }

  private getYesterdayDateRange(): { startDate: Date; endDate: Date } {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const startDate = new Date(yesterday);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(yesterday);
    endDate.setHours(23, 59, 59, 999);

    this.logger.debug(
      `Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`,
    );

    return { startDate, endDate };
  }

  // Manual trigger for testing
  async sendTestSummary(accountId: string, userId: string) {
    this.logger.log(`Manual test summary triggered for account: ${accountId}`);

    try {
      const account = await this.accountModel
        .findOne({ accountId, userId })
        .exec();

      if (!account) {
        this.logger.error(`Account not found: ${accountId} or not owned by user: ${userId}`);
        return false;
      }

      if (!account.email) {
        this.logger.error(`Account ${accountId} has no email configured`);
        return false;
      }

      const { startDate, endDate } = this.getYesterdayDateRange();
      await this.sendAccountSummary(account, startDate, endDate);

      return true;
    } catch (error) {
      this.logger.error(`Error sending test summary`, error);
      return false;
    }
  }
}
