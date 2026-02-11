import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AccountService } from './account.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../user/schemas/user.schema';
import { PaginatedResponse } from '../common/dto/pagination.dto';
import { AccountQueryDto } from './dto/account-query.dto';
import { Account } from './schemas/account.schema';

@Controller('accounts')
@UseGuards(JwtAuthGuard)
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get()
  async findAll(
    @CurrentUser() user: User,
    @Query() query: AccountQueryDto,
  ): Promise<PaginatedResponse<Account>> {
    const userId = user['_id'].toString();
    const filters = {
      type: query.type,
      subtype: query.subtype,
      itemId: query.itemId,
    };

    const [data, total] = await Promise.all([
      this.accountService.findAllByUser(userId, query.skip, query.limit, filters),
      this.accountService.countByUser(userId, filters),
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

  @Get(':accountId')
  async findOne(
    @Param('accountId') accountId: string,
    @CurrentUser() user: User,
  ) {
    return this.accountService.findByAccountIdAndUser(
      accountId,
      user['_id'].toString(),
    );
  }

  @Get('item/:itemId')
  async findByItemId(
    @Param('itemId') itemId: string,
    @CurrentUser() user: User,
  ) {
    return this.accountService.findByItemIdAndUser(
      itemId,
      user['_id'].toString(),
    );
  }
}
