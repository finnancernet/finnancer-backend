import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BudgetService } from './budget.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../user/schemas/user.schema';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { BudgetQueryDto } from './dto/budget-query.dto';
import { BudgetTransactionsQueryDto } from './dto/budget-transactions-query.dto';

@Controller('budgets')
@UseGuards(JwtAuthGuard)
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @Post()
  async create(
    @CurrentUser() user: User,
    @Body() dto: CreateBudgetDto,
  ) {
    return this.budgetService.create(user['_id'].toString(), dto);
  }

  @Get()
  async findAll(
    @CurrentUser() user: User,
    @Query() query: BudgetQueryDto,
  ) {
    const userId = user['_id'].toString();
    const filters = { category: query.category, period: query.period };

    const [data, total] = await Promise.all([
      this.budgetService.getAllBudgetsWithStatus(userId, query.skip, query.limit, filters),
      this.budgetService.countByUser(userId, filters),
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

  @Get('summary')
  async getSummary(@CurrentUser() user: User) {
    return this.budgetService.getBudgetSummaryByPeriod(user['_id'].toString());
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    return this.budgetService.getBudgetWithStatus(id, user['_id'].toString());
  }

  @Get(':id/transactions')
  async getTransactions(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Query() query: BudgetTransactionsQueryDto,
  ) {
    return this.budgetService.getBudgetTransactions(
      id,
      user['_id'].toString(),
      query.offset,
      query.skip,
      query.limit,
    );
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateBudgetDto,
  ) {
    return this.budgetService.update(id, user['_id'].toString(), dto);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    await this.budgetService.remove(id, user['_id'].toString());
    return { success: true };
  }
}
