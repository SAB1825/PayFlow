import { Inject, Injectable } from '@nestjs/common';
import {
  DRIZZLE_DB,
  type DrizzleDatabase,
} from '../../../../shared/infrastructure/database/drizzle.types';
import { refreshToken as refreshTokenTable } from '../../../../shared/infrastructure/database/schemas';
import { RefreshTokenRepositoryPort } from '../../application/ports/refresh-token.port';
import { RefreshToken } from '../../domain/value-object/refresh-token.vo';

@Injectable()
export class RefreshTokenRepository implements RefreshTokenRepositoryPort {
  constructor(
    @Inject(DRIZZLE_DB)
    private readonly db: DrizzleDatabase,
  ) {}

  async save(refreshToken: RefreshToken): Promise<void> {
    await this.db.insert(refreshTokenTable).values({
      userId: refreshToken.userId.getValue(),
      tokenHash: refreshToken.tokenHash,
      expiresAt: refreshToken.expiresAt,
    });
  }
}
