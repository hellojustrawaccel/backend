import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { GithubService } from './github.service';
import { GitlabService } from './gitlab.service';
import { SourcehutService } from './sourcehut.service';
import { WakatimeService } from './wakatime.service';

@Injectable()
export class StatsService {
  private readonly logger = new Logger(StatsService.name);

  constructor(
    private prisma: PrismaService,
    private githubService: GithubService,
    private gitlabService: GitlabService,
    private sourcehutService: SourcehutService,
    private wakatimeService: WakatimeService
  ) {}

  async updateProjectStats(projectId: string): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      this.logger.warn(`Project ${projectId} not found`);
      return;
    }

    try {
      this.logger.log(`Updating stats for project ${project.name} (${projectId})`);

      const providerStats = await this.fetchProviderStats(
        project.provider,
        project.repositoryUrl
      );

      const wakatimeStats = await this.wakatimeService.getProjectStats(project.name);

      const existingStats = await this.prisma.projectStats.findUnique({
        where: { projectId },
      });

      const statsData = {
        commitActivity: providerStats.commitActivity as any,
        languages: providerStats.languages as any,
        wakatime: wakatimeStats as any,
        stars: providerStats.stars,
        forks: providerStats.forks,
        openIssues: providerStats.openIssues,
        openPullRequests: providerStats.openPullRequests,
        contributors: providerStats.contributors as any,
        lastCommitDate: providerStats.lastCommitDate,
      };

      if (existingStats) {
        await this.prisma.projectStats.update({
          where: { projectId },
          data: statsData,
        });
      } else {
        await this.prisma.projectStats.create({
          data: {
            projectId,
            ...statsData,
          },
        });
      }

      this.logger.log(`Successfully updated stats for project ${project.name}`);
    } catch (error) {
      this.logger.error(`Failed to update stats for project ${project.name}:`, error);
    }
  }

  async updateAllProjectsStats(): Promise<void> {
    this.logger.log('Starting stats update for all projects');

    const projects = await this.prisma.project.findMany();

    for (const project of projects) {
      await this.updateProjectStats(project.id);
    }

    this.logger.log('Finished stats update for all projects');
  }

  private async fetchProviderStats(provider: string, repositoryUrl: string) {
    switch (provider) {
      case 'github':
        return this.githubService.getRepoStats(repositoryUrl);
      case 'gitlab':
        return this.gitlabService.getRepoStats(repositoryUrl);
      case 'sourcehut':
        return this.sourcehutService.getRepoStats(repositoryUrl);
      default:
        throw new Error(`unsupported provider: ${provider}`);
    }
  }

  async getProjectStats(projectId: string) {
    const stats = await this.prisma.projectStats.findUnique({
      where: { projectId },
    });

    return stats;
  }
}
