import { Inject, Injectable } from '@nestjs/common';
import {
  DRIZZLE_DB,
  type DrizzleDatabase,
} from '../../../../shared/infrastructure/database/drizzle.types';
import { refreshToken as refreshTokenTable } from '../../../../shared/infrastructure/database/schemas';
import {
  RefreshTokenRepositoryPort,
  TokenFromDb,
} from '../../application/ports/refresh-token.port';
import { RefreshToken } from '../../domain/value-object/refresh-token.vo';
import { UserId } from '../../domain/value-object/user-id.vo';
import { eq } from 'drizzle-orm';
import {
  ApplicationException,
  ApplicationExceptionCode,
} from '../../../../shared/domain/exception/application.exception';

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
      createdAt: new Date(),
    });
  }

  async findToken(userId: UserId): Promise<RefreshToken | null> {
    const token = await this.db
      .select()
      .from(refreshTokenTable)
      .where(eq(refreshTokenTable.userId, userId.getValue()));

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
      .from(refreshTokenTable)
      .where(eq(refreshTokenTable.tokenHash, refreshToken.tokenHash));
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
        .update(refreshTokenTable)
        .set({
          revokedAt: new Date(),
        })
        .where(eq(refreshTokenTable.tokenHash, oldToken.tokenHash));

      await tx.insert(refreshTokenTable).values({
        userId: refreshToken.userId.getValue(),
        tokenHash: refreshToken.tokenHash,
        expiresAt: refreshToken.expiresAt,
        createdAt: new Date(),
      });
    });
  }
}
