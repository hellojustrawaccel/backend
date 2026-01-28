import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';
import { ActivateUserDto } from './dto/activate-user.dto';
import { DeactivateUserDto } from './dto/deactivate-user.dto';
import { LoginDto } from './dto/login.dto';
import { OAuthVerifyDto } from './dto/oauth-verify.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { VerifyLoginDto } from './dto/verify-login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService
  ) {}

  private generateCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  private generateToken(userId: string, isAdmin: boolean): string {
    const payload = { userId, isAdmin };
    const secret = this.configService.get<string>('JWT_SECRET')!;
    return this.jwtService.sign(payload, { secret });
  }

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: { OR: [{ username: dto.username }, { email: dto.email }] },
    });

    if (existingUser) {
      if (existingUser.username === dto.username) {
        throw new BadRequestException('username already taken');
      }

      if (existingUser.email === dto.email) {
        throw new BadRequestException('email already registered');
      }
    }

    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        email: dto.email,
        emailVerified: false,
        active: false,
        isAdmin: false,
      },
    });

    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.prisma.loginCode.deleteMany({
      where: { userId: user.id, type: 'email_verification' },
    });

    await this.prisma.loginCode.create({
      data: { userId: user.id, code, type: 'email_verification', expiresAt },
    });

    await this.emailService.sendEmailVerification(user.email, code);

    const isDev = this.configService.get<string>('NODE_ENV') === 'development';

    return {
      message: 'registration successful, verify your email address',
      userId: user.id,
      ...(isDev && { code }),
    };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    if (!user) {
      throw new NotFoundException('user not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('email already verified');
    }

    const loginCode = await this.prisma.loginCode.findFirst({
      where: {
        userId: user.id,
        code: dto.code.toUpperCase(),
        type: 'email_verification',
        expiresAt: { gt: new Date() },
      },
    });

    if (!loginCode) {
      throw new BadRequestException('invalid or expired verification code');
    }

    await this.prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } });
    await this.prisma.loginCode.delete({ where: { id: loginCode.id } });

    await this.emailService.sendPendingActivation(user.email, user.username);

    return {
      message: 'email verified successfully, your account is pending admin activation',
      userId: user.id,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ username: dto.identifier }, { email: dto.identifier }] },
    });

    if (!user) {
      throw new NotFoundException('user not found');
    }

    if (!user.emailVerified) {
      throw new BadRequestException('verify your email address before logging in');
    }

    if (!user.active) {
      throw new BadRequestException('your account is pending admin activation');
    }

    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await this.prisma.loginCode.deleteMany({ where: { userId: user.id, type: 'login' } });
    await this.prisma.loginCode.create({
      data: { userId: user.id, code, type: 'login', expiresAt },
    });

    await this.emailService.sendLoginCode(user.email, code);

    const isDev = this.configService.get<string>('NODE_ENV') === 'development';

    return {
      message: 'login code sent to your email',
      ...(isDev && { code }),
    };
  }

  async verifyLogin(dto: VerifyLoginDto) {
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ username: dto.identifier }, { email: dto.identifier }] },
      include: { oauthAccounts: true },
    });

    if (!user) {
      throw new NotFoundException('user not found');
    }

    const loginCode = await this.prisma.loginCode.findFirst({
      where: {
        userId: user.id,
        code: dto.code.toUpperCase(),
        type: 'login',
        expiresAt: { gt: new Date() },
      },
    });

    if (!loginCode) {
      throw new BadRequestException('invalid or expired login code');
    }

    await this.prisma.loginCode.delete({ where: { id: loginCode.id } });

    const token = this.generateToken(user.id, user.isAdmin);

    return {
      access_token: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        active: user.active,
        emailVerified: user.emailVerified,
        image: user.image,
        createdAt: user.createdAt,
        oauthAccounts: user.oauthAccounts.map((account) => ({
          provider: account.provider,
          providerId: account.providerId,
        })),
      },
    };
  }

  async oauthVerify(dto: OAuthVerifyDto) {
    const existingOAuthAccount = await this.prisma.oAuthAccount.findUnique({
      where: { provider_providerId: { provider: dto.provider, providerId: dto.providerId } },
      include: { user: { include: { oauthAccounts: true } } },
    });

    if (existingOAuthAccount) {
      const user = existingOAuthAccount.user;

      const updatedUser = await this.prisma.user.update({
        where: { id: user.id },
        data: { email: dto.email || user.email, image: dto.image || user.image },
        include: { oauthAccounts: true },
      });

      const token = this.generateToken(updatedUser.id, updatedUser.isAdmin);

      return {
        access_token: token,
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          isAdmin: updatedUser.isAdmin,
          active: updatedUser.active,
          emailVerified: updatedUser.emailVerified,
          image: updatedUser.image,
          createdAt: updatedUser.createdAt,
          oauthAccounts: updatedUser.oauthAccounts.map((account) => ({
            provider: account.provider,
            providerId: account.providerId,
          })),
        },
      };
    }

    const existingUserByEmail = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { oauthAccounts: true },
    });

    if (existingUserByEmail) {
      await this.prisma.oAuthAccount.create({
        data: {
          userId: existingUserByEmail.id,
          provider: dto.provider,
          providerId: dto.providerId,
        },
      });

      const updatedUser = await this.prisma.user.update({
        where: { id: existingUserByEmail.id },
        data: {
          active: true,
          emailVerified: true,
          image: dto.image || existingUserByEmail.image,
        },
        include: { oauthAccounts: true },
      });

      const token = this.generateToken(updatedUser.id, updatedUser.isAdmin);

      return {
        access_token: token,
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          isAdmin: updatedUser.isAdmin,
          active: updatedUser.active,
          emailVerified: updatedUser.emailVerified,
          image: updatedUser.image,
          createdAt: updatedUser.createdAt,
          oauthAccounts: updatedUser.oauthAccounts.map((account) => ({
            provider: account.provider,
            providerId: account.providerId,
          })),
        },
      };
    }

    let username = dto.name
      ? dto.name.toLowerCase().replace(/\s+/g, '_')
      : dto.email
        ? dto.email.split('@')[0]
        : `user_${dto.providerId}`;

    let uniqueUsername = username;
    let counter = 1;
    while (await this.prisma.user.findUnique({ where: { username: uniqueUsername } })) {
      uniqueUsername = `${username}${counter}`;
      counter++;
    }

    const newUser = await this.prisma.user.create({
      data: {
        username: uniqueUsername,
        email: dto.email || `${dto.providerId}@${dto.provider}.oauth`,
        image: dto.image,
        emailVerified: true,
        active: true,
        isAdmin: false,
        oauthAccounts: { create: { provider: dto.provider, providerId: dto.providerId } },
      },
      include: { oauthAccounts: true },
    });

    const token = this.generateToken(newUser.id, newUser.isAdmin);

    return {
      access_token: token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        isAdmin: newUser.isAdmin,
        active: newUser.active,
        emailVerified: newUser.emailVerified,
        image: newUser.image,
        createdAt: newUser.createdAt,
        oauthAccounts: (newUser.oauthAccounts || []).map((account) => ({
          provider: account.provider,
          providerId: account.providerId,
        })),
      },
    };
  }

  async activateUser(dto: ActivateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!user) {
      throw new NotFoundException('user not found');
    }

    if (user.active) {
      throw new BadRequestException('user is already active');
    }

    if (!user.emailVerified) {
      throw new BadRequestException('user must verify email before activation');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: dto.userId },
      data: { active: true },
    });

    await this.emailService.sendActivationNotification(updatedUser.email);

    return {
      message: 'user activated',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        active: updatedUser.active,
        isAdmin: updatedUser.isAdmin,
      },
    };
  }

  async deactivateUser(dto: DeactivateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });

    if (!user) {
      throw new NotFoundException('user not found');
    }

    if (!user.active) {
      throw new BadRequestException('user is already inactive');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: dto.userId },
      data: { active: false },
    });

    return {
      message: 'user deactivated',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        active: updatedUser.active,
        isAdmin: updatedUser.isAdmin,
      },
    };
  }

  async getUsers(page: number = 1, limit: number = 10, provider?: string, active?: boolean) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (active !== undefined) {
      where.active = active;
    }

    if (provider) {
      if (provider === 'passwordless') {
        where.oauthAccounts = { none: {} };
      } else {
        where.oauthAccounts = { some: { provider } };
      }
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { oauthAccounts: { select: { provider: true, providerId: true } } },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users: users.map((user) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        active: user.active,
        emailVerified: user.emailVerified,
        image: user.image,
        createdAt: user.createdAt,
        oauthAccounts: user.oauthAccounts,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getRegistrationHealth() {
    return true;
  }
}
