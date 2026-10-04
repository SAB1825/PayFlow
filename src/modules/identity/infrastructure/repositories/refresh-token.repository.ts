import { Inject, Injectable } from '@nestjs/common';
import {
  DRIZZLE_DB,
  type DrizzleDatabase,
} from '../../../../shared/infrastructure/database/drizzle.types';
import { RefreshTokenRepositoryPort } from '../../application/ports/refresh-token.port';
import { RefreshToken } from '../../domain/entities/refresh-token.entity';
import { UserId } from '../../domain/value-object/user-id.vo';
import { RefreshTokenId } from '../../domain/value-object/refresh-token-id.vo';
import { TokenFamilyId } from '../../domain/value-object/token-family-id.vo';
import { and, eq, isNull } from 'drizzle-orm';
import {
  ApplicationException,
  ApplicationExceptionCode,
} from '../../../../shared/domain/exception/application.exception';
import {
  refreshTokens,
  type NewRefreshTokenDB,
  type RefreshTokenDB,
} from '../../../../shared/infrastructure/database/schemas';

@Injectable()
export class RefreshTokenRepository implements RefreshTokenRepositoryPort {
  constructor(
    @Inject(DRIZZLE_DB)
    private readonly db: DrizzleDatabase,
  ) {}

  async save(refreshToken: RefreshToken): Promise<void> {
    await this.db
      .insert(refreshTokens)
      .values(RefreshTokenRepository.toPersistance(refreshToken));
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    const rows = await this.db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.tokenHash, tokenHash));

    if (rows.length === 0) {
      return null;
    }

    return RefreshTokenRepository.toDomain(rows[0]);
  }

  async revokeToken(refreshToken: RefreshToken): Promise<void> {
    if (!refreshToken.isRevoked()) {
      refreshToken.revoke();
    }

    const rows = await this.db
      .update(refreshTokens)
      .set({ revokedAt: refreshToken.revokedAt })
      .where(eq(refreshTokens.id, refreshToken.id.getValue()))
      .returning({ id: refreshTokens.id });

    if (rows.length === 0) {
      throw new ApplicationException(
        'Refresh token not found in database',
        ApplicationExceptionCode.NOT_FOUND,
      );
    }
  }

  /**
   * Revokes every still-active token in a rotation chain. Used on reuse
   * detection: once one token of a family is replayed the whole family is
   * considered compromised.
   */
  async revokeFamily(familyId: TokenFamilyId): Promise<void> {
    await this.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(refreshTokens.familyId, familyId.getValue()),
          isNull(refreshTokens.revokedAt),
        ),
      );
  }

  async replace(
    oldToken: RefreshToken,
    refreshToken: RefreshToken,
  ): Promise<void> {
    if (!oldToken.isRevoked()) {
      oldToken.revoke();
    }

    await this.db.transaction(async (tx) => {
      await tx
        .update(refreshTokens)
        .set({ revokedAt: oldToken.revokedAt })
        .where(eq(refreshTokens.id, oldToken.id.getValue()));

      await tx
        .insert(refreshTokens)
        .values(RefreshTokenRepository.toPersistance(refreshToken));
    });
  }

  static toPersistance(refreshToken: RefreshToken): NewRefreshTokenDB {
    return {
      id: refreshToken.id.getValue(),
      userId: refreshToken.userId.getValue(),
      familyId: refreshToken.familyId.getValue(),
      tokenHash: refreshToken.tokenHash,
      expiresAt: refreshToken.expiresAt,
      revokedAt: refreshToken.revokedAt,
      createdAt: refreshToken.createdAt,
    };
  }

  static toDomain(row: RefreshTokenDB): RefreshToken {
    return RefreshToken.reconstitute({
      id: RefreshTokenId.fromString(row.id),
      userId: UserId.fromString(row.userId),
      familyId: TokenFamilyId.fromString(row.familyId),
      tokenHash: row.tokenHash,
      expiresAt: row.expiresAt,
      revokedAt: row.revokedAt,
      createdAt: row.createdAt,
    });
  }
}
