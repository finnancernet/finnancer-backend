import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../user/schemas/user.schema';
import { TransactionQueryDto } from './dto/transaction-query.dto';
import { PaginatedResponse } from '../common/dto/pagination.dto';
import { Transaction } from './schemas/transaction.schema';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get()
  async findAll(
    @CurrentUser() user: User,
    @Query() query: TransactionQueryDto,
  ): Promise<PaginatedResponse<Transaction>> {
    const userId = user['_id'].toString();
    const filters = {
      accountId: query.accountId,
      startDate: query.startDate,
      endDate: query.endDate,
      minAmount: query.minAmount,
      maxAmount: query.maxAmount,
      category: query.category,
      pending: query.pending,
      search: query.search,
    };

    const [data, total] = await Promise.all([
      this.transactionService.findAllByUser(userId, query.skip, query.limit, filters),
      this.transactionService.countByUser(userId, filters),
    ]);

    const totalPages = Math.ceil(total / query.limit);

    return {
      data,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages,
        hasNextPage: query.page < totalPages,
        hasPreviousPage: query.page > 1,
      },
    };
  }

  @Get(':transactionId')
  async findOne(
    @Param('transactionId') transactionId: string,
    @CurrentUser() user: User,
  ) {
    return this.transactionService.findByTransactionIdAndUser(
      transactionId,
      user['_id'].toString(),
    );
  }

  @Get('account/:accountId')
  async findByAccountId(
    @Param('accountId') accountId: string,
    @CurrentUser() user: User,
    @Query() query: TransactionQueryDto,
  ) {
    const userId = user['_id'].toString();

    if (query.startDate && query.endDate) {
      return this.transactionService.findByDateRangeAndUser(
        accountId,
        userId,
        new Date(query.startDate),
        new Date(query.endDate),
      );
    }
    return this.transactionService.findByAccountIdAndUser(accountId, userId);
  }
}
