import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { Transaction, TransactionDocument } from './schemas/transaction.schema';
import { Account, AccountDocument } from '../account/schemas/account.schema';

export interface TransactionFilters {
  accountId?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  category?: string;
  pending?: boolean;
  search?: string;
}

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
    @InjectModel(Account.name)
    private accountModel: Model<AccountDocument>,
  ) {}

  async upsertTransaction(
    transactionData: Partial<Transaction>,
  ): Promise<Transaction> {
    try {
      const transaction = await this.transactionModel
        .findOneAndUpdate(
          { transactionId: transactionData.transactionId },
          { $set: transactionData },
          { upsert: true, new: true },
        )
        .exec();

      this.logger.debug(
        `Upserted transaction: ${transactionData.transactionId}`,
      );
      return transaction;
    } catch (error) {
      this.logger.error(
        `Error upserting transaction ${transactionData.transactionId}`,
        error,
      );
      throw error;
    }
  }

  async findAll(): Promise<Transaction[]> {
    return this.transactionModel.find().sort({ date: -1 }).exec();
  }

  private buildTransactionQuery(
    accountIds: string[],
    filters?: TransactionFilters,
  ): FilterQuery<TransactionDocument> {
    const query: FilterQuery<TransactionDocument> = {
      accountId: filters?.accountId
        ? filters.accountId
        : { $in: accountIds },
    };

    if (filters?.startDate || filters?.endDate) {
      query.date = {};
      if (filters.startDate) query.date.$gte = new Date(filters.startDate);
      if (filters.endDate) query.date.$lte = new Date(filters.endDate);
    }

    if (filters?.minAmount !== undefined || filters?.maxAmount !== undefined) {
      query.amount = {};
      if (filters.minAmount !== undefined) query.amount.$gte = filters.minAmount;
      if (filters.maxAmount !== undefined) query.amount.$lte = filters.maxAmount;
    }

    if (filters?.category) {
      query['personalFinanceCategory.primary'] = filters.category;
    }

    if (filters?.pending !== undefined) {
      query.pending = filters.pending;
    }

    if (filters?.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { merchantName: { $regex: filters.search, $options: 'i' } },
        { originalDescription: { $regex: filters.search, $options: 'i' } },
      ];
    }

    return query;
  }

  private async getAccountIdsForUser(userId: string): Promise<string[]> {
    const accounts = await this.accountModel
      .find({ userId })
      .exec();
    return accounts.map((acc) => acc.accountId);
  }

  async findAllByUser(
    userId: string,
    skip?: number,
    limit?: number,
    filters?: TransactionFilters,
  ): Promise<Transaction[]> {
    const accountIds = await this.getAccountIdsForUser(userId);
    const mongoQuery = this.buildTransactionQuery(accountIds, filters);

    const query = this.transactionModel
      .find(mongoQuery)
      .sort({ date: -1 });

    if (skip !== undefined) {
      query.skip(skip);
    }

    if (limit !== undefined) {
      query.limit(limit);
    }

    return query.exec();
  }

  async countByUser(userId: string, filters?: TransactionFilters): Promise<number> {
    const accountIds = await this.getAccountIdsForUser(userId);
    const mongoQuery = this.buildTransactionQuery(accountIds, filters);

    return this.transactionModel
      .countDocuments(mongoQuery)
      .exec();
  }

  async findByTransactionId(transactionId: string): Promise<Transaction> {
    return this.transactionModel.findOne({ transactionId }).exec();
  }

  async findByTransactionIdAndUser(
    transactionId: string,
    userId: string,
  ): Promise<Transaction> {
    const accountIds = await this.getAccountIdsForUser(userId);

    return this.transactionModel
      .findOne({ transactionId, accountId: { $in: accountIds } })
      .exec();
  }

  async findByAccountId(accountId: string): Promise<Transaction[]> {
    return this.transactionModel
      .find({ accountId })
      .sort({ date: -1 })
      .exec();
  }

  async findByAccountIdAndUser(
    accountId: string,
    userId: string,
  ): Promise<Transaction[]> {
    // Verify the account belongs to the user
    const account = await this.accountModel
      .findOne({ accountId, userId })
      .exec();
    if (!account) {
      return [];
    }

    return this.transactionModel
      .find({ accountId })
      .sort({ date: -1 })
      .exec();
  }

  async findByDateRange(
    accountId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Transaction[]> {
    return this.transactionModel
      .find({
        accountId,
        date: { $gte: startDate, $lte: endDate },
      })
      .sort({ date: -1 })
      .exec();
  }

  async findByDateRangeAndUser(
    accountId: string,
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Transaction[]> {
    // Verify the account belongs to the user
    const account = await this.accountModel
      .findOne({ accountId, userId })
      .exec();
    if (!account) {
      return [];
    }

    return this.transactionModel
      .find({
        accountId,
        date: { $gte: startDate, $lte: endDate },
      })
      .sort({ date: -1 })
      .exec();
  }

  async deleteTransaction(transactionId: string): Promise<void> {
    await this.transactionModel.deleteOne({ transactionId }).exec();
    this.logger.log(`Deleted transaction: ${transactionId}`);
  }
}
