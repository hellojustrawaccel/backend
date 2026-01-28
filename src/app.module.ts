import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './auth/auth.module';
// import { CommentsModule } from './comments/comments.module';
import { ExperienceModule } from './experience/experience.module';
// import { LikesModule } from './likes/likes.module';
import { LinksModule } from './links/links.module';
// import { PostsModule } from './posts/posts.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    PrismaModule,
    LinksModule,
    ExperienceModule,
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
