import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { Budget, BudgetDocument } from './schemas/budget.schema';
import { Transaction, TransactionDocument } from '../transaction/schemas/transaction.schema';
import { Account, AccountDocument } from '../account/schemas/account.schema';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

export interface BudgetWithStatus {
  budget: Budget;
  spent: number;
  remaining: number;
  percentage: number;
}

@Injectable()
export class BudgetService {
  private readonly logger = new Logger(BudgetService.name);

  constructor(
    @InjectModel(Budget.name) private budgetModel: Model<BudgetDocument>,
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    @InjectModel(Account.name) private accountModel: Model<AccountDocument>,
  ) {}

  async create(userId: string, dto: CreateBudgetDto): Promise<Budget> {
    const budget = new this.budgetModel({ ...dto, userId });
    await budget.save();
    this.logger.log(`Created budget "${dto.name}" for user ${userId}`);
    return budget;
  }

  async findAllByUser(
    userId: string,
    skip?: number,
    limit?: number,
    filters?: { category?: string; period?: string },
  ): Promise<Budget[]> {
    const query: FilterQuery<BudgetDocument> = { userId, isActive: true };
    if (filters?.category) query.categories = filters.category;
    if (filters?.period) query.period = filters.period;

    const q = this.budgetModel.find(query).sort({ createdAt: -1 });
    if (skip !== undefined) q.skip(skip);
    if (limit !== undefined) q.limit(limit);
    return q.exec();
  }

  async countByUser(
    userId: string,
    filters?: { category?: string; period?: string },
  ): Promise<number> {
    const query: FilterQuery<BudgetDocument> = { userId, isActive: true };
    if (filters?.category) query.categories = filters.category;
    if (filters?.period) query.period = filters.period;
    return this.budgetModel.countDocuments(query).exec();
  }

  async findOneByUser(budgetId: string, userId: string): Promise<Budget> {
    const budget = await this.budgetModel.findOne({ _id: budgetId, userId }).exec();
    if (!budget) throw new NotFoundException('Budget not found');
    return budget;
  }

  async update(budgetId: string, userId: string, dto: UpdateBudgetDto): Promise<Budget> {
    const budget = await this.budgetModel
      .findOneAndUpdate({ _id: budgetId, userId }, { $set: dto }, { new: true })
      .exec();
    if (!budget) throw new NotFoundException('Budget not found');
    this.logger.log(`Updated budget ${budgetId}`);
    return budget;
  }

  async remove(budgetId: string, userId: string): Promise<void> {
    const result = await this.budgetModel.deleteOne({ _id: budgetId, userId }).exec();
    if (result.deletedCount === 0) throw new NotFoundException('Budget not found');
    this.logger.log(`Deleted budget ${budgetId}`);
  }

  async getBudgetWithStatus(budgetId: string, userId: string, offset: number = 0): Promise<BudgetWithStatus> {
    const budget = await this.findOneByUser(budgetId, userId);
    const accountIds = await this.getAccountIdsForUser(userId);
    const spent = await this.calculateSpent(accountIds, budget.categories, budget.period, offset);
    const remaining = budget.amount - spent;
    const percentage = budget.amount > 0 ? Math.round((spent / budget.amount) * 100) : 0;
    return { budget, spent, remaining, percentage };
  }

  async getBudgetTransactions(
    budgetId: string,
    userId: string,
    offset: number = 0,
    skip: number = 0,
    limit: number = 20,
  ) {
    const budget = await this.findOneByUser(budgetId, userId);
    const accountIds = await this.getAccountIdsForUser(userId);
    const { startDate, endDate } = this.getPeriodDateRange(budget.period, offset);

    if (accountIds.length === 0) {
      return {
        budget,
        spent: 0,
        remaining: budget.amount,
        percentage: 0,
        periodStart: startDate.toISOString(),
        periodEnd: endDate.toISOString(),
        transactions: { data: [], meta: { total: 0, page: Math.floor(skip / limit) + 1, limit, totalPages: 0, hasNextPage: false, hasPreviousPage: false } },
      };
    }

    const matchQuery = {
      accountId: { $in: accountIds },
      'personalFinanceCategory.primary': { $in: budget.categories },
      date: { $gte: startDate, $lte: endDate },
      pending: false,
    };

    const [transactions, total, spentResult] = await Promise.all([
      this.transactionModel
        .find(matchQuery)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.transactionModel.countDocuments(matchQuery).exec(),
      this.transactionModel.aggregate([
        { $match: matchQuery },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const spent = spentResult.length > 0 ? Math.max(spentResult[0].total, 0) : 0;
    const remaining = budget.amount - spent;
    const percentage = budget.amount > 0 ? Math.round((spent / budget.amount) * 100) : 0;
    const page = Math.floor(skip / limit) + 1;
    const totalPages = Math.ceil(total / limit);

    return {
      budget,
      spent,
      remaining,
      percentage,
      periodStart: startDate.toISOString(),
      periodEnd: endDate.toISOString(),
      transactions: {
        data: transactions,
        meta: { total, page, limit, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 },
      },
    };
  }

  async getAllBudgetsWithStatus(
    userId: string,
    skip?: number,
    limit?: number,
    filters?: { category?: string; period?: string },
  ): Promise<BudgetWithStatus[]> {
    const budgets = await this.findAllByUser(userId, skip, limit, filters);
    const accountIds = await this.getAccountIdsForUser(userId);
    const results: BudgetWithStatus[] = [];

    for (const budget of budgets) {
      const spent = await this.calculateSpent(accountIds, budget.categories, budget.period);
      const remaining = budget.amount - spent;
      const percentage = budget.amount > 0 ? Math.round((spent / budget.amount) * 100) : 0;
      results.push({ budget, spent, remaining, percentage });
    }

    return results;
  }

  async getBudgetSummaryByPeriod(userId: string): Promise<Record<string, BudgetWithStatus[]>> {
    const budgets = await this.budgetModel.find({ userId, isActive: true }).exec();
    const accountIds = await this.getAccountIdsForUser(userId);

    const summary: Record<string, BudgetWithStatus[]> = {
      weekly: [],
      monthly: [],
      yearly: [],
    };

    for (const budget of budgets) {
      const spent = await this.calculateSpent(accountIds, budget.categories, budget.period);
      const remaining = budget.amount - spent;
      const percentage = budget.amount > 0 ? Math.round((spent / budget.amount) * 100) : 0;
      summary[budget.period].push({ budget, spent, remaining, percentage });
    }

    return summary;
  }

  private async getAccountIdsForUser(userId: string): Promise<string[]> {
    const accounts = await this.accountModel.find({ userId }).exec();
    return accounts.map((a) => a.accountId);
  }

  private async calculateSpent(
    accountIds: string[],
    categories: string[],
    period: string,
    offset: number = 0,
  ): Promise<number> {
    if (accountIds.length === 0) return 0;

    const { startDate, endDate } = this.getPeriodDateRange(period, offset);

    const result = await this.transactionModel.aggregate([
      {
        $match: {
          accountId: { $in: accountIds },
          'personalFinanceCategory.primary': { $in: categories },
          date: { $gte: startDate, $lte: endDate },
          pending: false,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);

    // Plaid amounts: positive = money spent, negative = income
    return result.length > 0 ? Math.max(result[0].total, 0) : 0;
  }

  private getPeriodDateRange(period: string, offset: number = 0): { startDate: Date; endDate: Date } {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (period) {
      case 'weekly': {
        startDate = new Date(now);
        const day = startDate.getDay();
        startDate.setDate(startDate.getDate() - day + offset * 7);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      }
      case 'yearly': {
        startDate = new Date(now.getFullYear() + offset, 0, 1);
        endDate = new Date(now.getFullYear() + offset, 11, 31, 23, 59, 59, 999);
        break;
      }
      case 'monthly':
      default: {
        startDate = new Date(now.getFullYear(), now.getMonth() + offset, 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0, 23, 59, 59, 999);
        break;
      }
    }

    // Cap endDate to now if viewing current or future period
    if (endDate > now && offset >= 0) {
      endDate = new Date(now);
    }

    return { startDate, endDate };
  }
}
