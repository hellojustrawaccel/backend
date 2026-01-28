import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: { userId: string; isAdmin: boolean }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        oauthAccounts: {
          select: {
            provider: true,
            providerId: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('user not found');
    }

    if (!user.active) {
      throw new UnauthorizedException('user account is not active');
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
      active: user.active,
      emailVerified: user.emailVerified,
      image: user.image,
      oauthAccounts: user.oauthAccounts,
    };
  }
}
