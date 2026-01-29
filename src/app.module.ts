import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './auth/auth.module';
import { ExperienceModule } from './experience/experience.module';
import { LinksModule } from './links/links.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './projects/projects.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    PrismaModule,
    LinksModule,
    ExperienceModule,
    AuthModule,
    ProjectsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
