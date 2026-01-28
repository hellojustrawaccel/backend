import {
  Body,
  Controller,
  Get,
  ParseBoolPipe,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { AuthService } from './auth.service';
import { ActivateUserDto } from './dto/activate-user.dto';
import { DeactivateUserDto } from './dto/deactivate-user.dto';
import { LoginDto } from './dto/login.dto';
import { OAuthVerifyDto } from './dto/oauth-verify.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { VerifyLoginDto } from './dto/verify-login.dto';
import { AdminGuard } from './guards/admin.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ short: { limit: 3, ttl: 300000 } })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('verify-email')
  @Throttle({ short: { limit: 10, ttl: 60000 } })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Post('login')
  @Throttle({ short: { limit: 3, ttl: 300000 } })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('verify-login')
  @Throttle({ short: { limit: 10, ttl: 60000 } })
  async verifyLogin(@Body() dto: VerifyLoginDto) {
    return this.authService.verifyLogin(dto);
  }

  @Post('oauth')
  @Throttle({ short: { limit: 10, ttl: 60000 } })
  async verifyOAuth(@Body() dto: OAuthVerifyDto) {
    return this.authService.oauthVerify(dto);
  }

  @Get('registration/health')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getRegistrationHealth() {
    return this.authService.getRegistrationHealth();
  }

  @Get('users')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getUsers(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('provider') provider?: string,
    @Query('active', new ParseBoolPipe({ optional: true })) active?: boolean
  ) {
    return this.authService.getUsers(page, limit, provider, active);
  }

  @Post('activate')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Throttle({ short: { limit: 20, ttl: 60000 } })
  async activateUser(@Body() dto: ActivateUserDto) {
    return this.authService.activateUser(dto);
  }

  @Post('deactivate')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Throttle({ short: { limit: 20, ttl: 60000 } })
  async deactivateUser(@Body() dto: DeactivateUserDto) {
    return this.authService.deactivateUser(dto);
  }
}
