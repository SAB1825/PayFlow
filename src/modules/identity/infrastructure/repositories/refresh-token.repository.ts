import { Inject, Injectable } from '@nestjs/common';
import {
  DRIZZLE_DB,
  type DrizzleDatabase,
} from '../../../../shared/infrastructure/database/drizzle.types';
import { RefreshTokenRepositoryPort } from '../../application/ports/refresh-token.port';
import { RefreshToken } from '../../domain/value-object/refresh-token.vo';
import { UserId } from '../../domain/value-object/user-id.vo';
import { eq } from 'drizzle-orm';
import {
  ApplicationException,
  ApplicationExceptionCode,
} from '../../../../shared/domain/exception/application.exception';
import { refreshTokens } from '../../../../shared/infrastructure/database/schemas';

@Injectable()
export class RefreshTokenRepository implements RefreshTokenRepositoryPort {
  constructor(
    @Inject(DRIZZLE_DB)
    private readonly db: DrizzleDatabase,
  ) {}

  async save(refreshToken: RefreshToken): Promise<void> {
    await this.db.insert(refreshTokens).values({
      userId: refreshToken.userId.getValue(),
      tokenHash: refreshToken.tokenHash,
      expiresAt: refreshToken.expiresAt,
      createdAt: new Date(),
    });
  }

  async findToken(userId: UserId): Promise<RefreshToken | null> {
    const token = await this.db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.userId, userId.getValue()));

    if (token.length === 0) return null;

    return RefreshToken.create(
      token[0].tokenHash,
      UserId.fromString(token[0].userId),
      token[0].expiresAt!,
    );
  }

  async revokeToken(refreshToken: RefreshToken): Promise<void> {
    const token = await this.db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.tokenHash, refreshToken.tokenHash));
    if (token.length === 0)
      throw new ApplicationException(
        'Token not found database',
        ApplicationExceptionCode.NOT_FOUND,
      );
  }

  async replace(
    oldToken: RefreshToken,
    refreshToken: RefreshToken,
  ): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx
        .update(refreshTokens)
        .set({
          revokedAt: new Date(),
        })
        .where(eq(refreshTokens.tokenHash, oldToken.tokenHash));

      await tx.insert(refreshTokens).values({
        userId: refreshToken.userId.getValue(),
        tokenHash: refreshToken.tokenHash,
        expiresAt: refreshToken.expiresAt,
        createdAt: new Date(),
      });
    });
  }
}
