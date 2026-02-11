import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { Account, AccountDocument } from './schemas/account.schema';

export interface AccountFilters {
  type?: string;
  subtype?: string;
  itemId?: string;
}

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);

  constructor(
    @InjectModel(Account.name) private accountModel: Model<AccountDocument>,
  ) {}

  private buildFilters(userId: string, filters?: AccountFilters): FilterQuery<AccountDocument> {
    const query: FilterQuery<AccountDocument> = { userId };
    if (filters?.type) query.type = filters.type;
    if (filters?.subtype) query.subtype = filters.subtype;
    if (filters?.itemId) query.itemId = filters.itemId;
    return query;
  }

  async upsertAccount(accountData: Partial<Account>): Promise<Account> {
    try {
      const account = await this.accountModel
        .findOneAndUpdate(
          { accountId: accountData.accountId },
          { $set: accountData },
          { upsert: true, new: true },
        )
        .exec();

      this.logger.debug(`Upserted account: ${accountData.accountId}`);
      return account;
    } catch (error) {
      this.logger.error(
        `Error upserting account ${accountData.accountId}`,
        error,
      );
      throw error;
    }
  }

  async findAll(): Promise<Account[]> {
    return this.accountModel.find().exec();
  }

  async findAllByUser(
    userId: string,
    skip?: number,
    limit?: number,
    filters?: AccountFilters,
  ): Promise<Account[]> {
    const query = this.accountModel.find(this.buildFilters(userId, filters));

    if (skip !== undefined) {
      query.skip(skip);
    }

    if (limit !== undefined) {
      query.limit(limit);
    }
    return query.exec();
  }

  async countByUser(userId: string, filters?: AccountFilters): Promise<number> {
    return this.accountModel
      .countDocuments(this.buildFilters(userId, filters))
      .exec();
  }

  async findByAccountId(accountId: string): Promise<Account> {
    return this.accountModel.findOne({ accountId }).exec();
  }

  async findByAccountIdAndUser(
    accountId: string,
    userId: string,
  ): Promise<Account> {
    return this.accountModel
      .findOne({ accountId, userId })
      .exec();
  }

  async findByItemId(itemId: string): Promise<Account[]> {
    return this.accountModel.find({ itemId }).exec();
  }

  async findByItemIdAndUser(
    itemId: string,
    userId: string,
  ): Promise<Account[]> {
    return this.accountModel
      .find({ itemId, userId })
      .exec();
  }

  async deleteAccount(accountId: string): Promise<void> {
    await this.accountModel.deleteOne({ accountId }).exec();
    this.logger.log(`Deleted account: ${accountId}`);
  }

  async deleteAccountByUser(accountId: string, userId: string): Promise<void> {
    await this.accountModel.deleteOne({ accountId, userId }).exec();
    this.logger.log(`Deleted account: ${accountId} for user: ${userId}`);
  }
}
