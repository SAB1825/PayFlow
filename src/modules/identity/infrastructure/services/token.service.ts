import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import {
  JwtPayload,
  TokenServicePort,
} from '../../application/ports/token-service.port';
import * as argon2 from 'argon2';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TokenService implements TokenServicePort {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async generateAccessToken(payload: JwtPayload): Promise<string> {
    return await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('ACCESS_TOKEN_SECRET'),
      expiresIn: this.configService.getOrThrow<string>(
        'ACCESS_TOKEN_EXPIRES_IN',
      ) as JwtSignOptions['expiresIn'],
    });
  }

  async generateRefreshToken(payload: JwtPayload): Promise<string> {
    return await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('REFRESH_TOKEN_SECRET'),
      expiresIn: this.configService.getOrThrow<string>(
        'REFRESH_TOKEN_EXPIRES_IN',
      ) as JwtSignOptions['expiresIn'],
    });
  }

  hashToken(token: string): Promise<string> {
    return argon2.hash(token);
  }

  async verifyAccessToken(token: string): Promise<JwtPayload> {
    const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
      secret: this.configService.getOrThrow<string>('ACCESS_TOKEN_SECRET'),
    });
    return payload;
  }

  async verifyRefreshToken(token: string): Promise<JwtPayload> {
    const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
      secret: this.configService.getOrThrow<string>('REFRESH_TOKEN_SECRET'),
    });

    return payload;
  }

  getRefreshTokenExpiresAt(): Date {
    const ttl = TokenService.toMs(
      this.configService.getOrThrow<string>('REFRESH_TOKEN_EXPIRES_IN'),
    );

    return new Date(Date.now() + ttl);
  }

  private static toMs(duration: string): number {
    const match = /^(\d+)\s*(ms|s|m|h|d)$/.exec(duration.trim());

    if (!match) {
      throw new Error(`Invalid duration: ${duration}`);
    }

    const value = Number(match[1]);
    const unit = match[2];
    const factors: Record<string, number> = {
      ms: 1,
      s: 1_000,
      m: 60_000,
      h: 3_600_000,
      d: 86_400_000,
    };

    return value * factors[unit];
  }
}
