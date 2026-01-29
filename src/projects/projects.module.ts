import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { PrismaModule } from '../prisma/prisma.module';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { GithubService } from './services/github.service';
import { GitlabService } from './services/gitlab.service';
import { SourcehutService } from './services/sourcehut.service';
import { StatsService } from './services/stats.service';
import { TasksService } from './services/tasks.service';
import { WakatimeService } from './services/wakatime.service';

@Module({
  imports: [PrismaModule, ScheduleModule.forRoot()],
  controllers: [ProjectsController],
  providers: [
    ProjectsService,
    StatsService,
    GithubService,
    GitlabService,
    SourcehutService,
    WakatimeService,
    TasksService,
  ],
  exports: [ProjectsService, StatsService],
})
export class ProjectsModule {}
