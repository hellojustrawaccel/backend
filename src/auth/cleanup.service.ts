import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredCodes() {
    this.logger.log('Starting cleanup of expired login codes...');

    try {
      const result = await this.prisma.loginCode.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });

      this.logger.log(`Cleaned up ${result.count} expired login codes`);
    } catch (error) {
      this.logger.error('Failed to cleanup expired login codes', error);
    }
  }

  @Cron(CronExpression.EVERY_WEEK)
  async cleanupInactiveOAuthAccounts() {
    this.logger.log('Starting cleanup of inactive OAuth accounts...');

    const inactiveDays = parseInt(process.env.OAUTH_INACTIVE_DAYS || '365', 10);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - inactiveDays);

    try {
      const result = await this.prisma.oAuthAccount.deleteMany({
        where: { updatedAt: { lt: cutoffDate }, user: { active: false } },
      });

      this.logger.log(
        `Cleaned up ${result.count} inactive OAuth accounts (inactive > ${inactiveDays} days)`
      );
    } catch (error) {
      this.logger.error('Failed to cleanup inactive OAuth accounts', error);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_NOON)
  async cleanupUnverifiedUsers() {
    this.logger.log('Starting cleanup of unverified users...');

    const unverifiedDays = parseInt(process.env.UNVERIFIED_CLEANUP_DAYS || '7', 10);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - unverifiedDays);

    try {
      const unverifiedUsers = await this.prisma.user.findMany({
        where: {
          emailVerified: false,
          createdAt: { lt: cutoffDate },
          oauthAccounts: { none: {} },
        },
        select: { id: true },
      });

      if (unverifiedUsers.length === 0) {
        this.logger.log('No unverified users to clean up');
        return;
      }

      await this.prisma.loginCode.deleteMany({
        where: { userId: { in: unverifiedUsers.map((u) => u.id) } },
      });

      const result = await this.prisma.user.deleteMany({
        where: { id: { in: unverifiedUsers.map((u) => u.id) } },
      });

      this.logger.log(
        `Cleaned up ${result.count} unverified users (created > ${unverifiedDays} days ago)`
      );
    } catch (error) {
      this.logger.error('Failed to cleanup unverified users', error);
    }
  }

  async runAllCleanupTasks() {
    this.logger.log('Running all cleanup tasks manually...');

    await this.cleanupExpiredCodes();
    await this.cleanupInactiveOAuthAccounts();
    await this.cleanupUnverifiedUsers();

    this.logger.log('All cleanup tasks completed');
  }
}
