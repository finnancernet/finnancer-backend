import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { EmailSchedulerService } from './email-scheduler.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../user/schemas/user.schema';
import { CreateSyncConfigDto } from './dto/create-sync-config.dto';

@Controller('scheduler')
@UseGuards(JwtAuthGuard)
export class SchedulerController {
  constructor(
    private readonly schedulerService: SchedulerService,
    private readonly emailSchedulerService: EmailSchedulerService,
  ) {}

  @Get('configs')
  async getSyncConfigs(@CurrentUser() user: User) {
    return this.schedulerService.getSyncConfigsByUser(user['_id'].toString());
  }

  @Post('configs')
  async addSyncConfig(
    @Body() createSyncConfigDto: CreateSyncConfigDto,
    @CurrentUser() user: User,
  ) {
    return this.schedulerService.addSyncConfig(
      user['_id'].toString(),
      createSyncConfigDto.itemId,
      createSyncConfigDto.accessToken,
      createSyncConfigDto.institutionName,
    );
  }

  @Delete('configs/:itemId')
  async removeSyncConfig(
    @Param('itemId') itemId: string,
    @CurrentUser() user: User,
  ) {
    return this.schedulerService.removeSyncConfig(
      itemId,
      user['_id'].toString(),
    );
  }

  @Post('test-email/:accountId')
  async sendTestEmail(
    @Param('accountId') accountId: string,
    @CurrentUser() user: User,
  ) {
    const result = await this.emailSchedulerService.sendTestSummary(
      accountId,
      user['_id'].toString(),
    );
    return {
      success: result,
      message: result
        ? 'Test email sent successfully'
        : 'Failed to send test email',
    };
  }
}
