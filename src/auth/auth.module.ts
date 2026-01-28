import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';

import { EmailModule } from '../email/email.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CleanupService } from './cleanup.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PrismaModule,
    EmailModule,
    PassportModule,
    ConfigModule,
    ScheduleModule.forRoot(),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<number>('JWT_EXPIRATION') },
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 60000, limit: 10 },
      { name: 'medium', ttl: 300000, limit: 3 },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, CleanupService],
  exports: [AuthService],
})
export class AuthModule {}
