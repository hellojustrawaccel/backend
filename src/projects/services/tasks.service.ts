import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { StatsService } from './stats.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(private statsService: StatsService) {}

  @Cron(CronExpression.EVERY_3_HOURS)
  async handleStatsUpdate() {
    this.logger.log('Starting scheduled stats update');

    try {
      await this.statsService.updateAllProjectsStats();
      this.logger.log('Scheduled stats update completed successfully');
    } catch (error) {
      this.logger.error('Scheduled stats update failed:', error);
    }
  }
}
