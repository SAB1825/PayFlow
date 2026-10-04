import { RefreshToken } from '../../domain/entities/refresh-token.entity';
import { TokenFamilyId } from '../../domain/value-object/token-family-id.vo';

export const REFRESH_TOKEN_REPOSITORY = Symbol('REFRESH_TOKEN_REPOSITORY');

export interface RefreshTokenRepositoryPort {
  save(refreshToken: RefreshToken): Promise<void>;
  findByTokenHash(tokenHash: string): Promise<RefreshToken | null>;
  revokeToken(refreshToken: RefreshToken): Promise<void>;
  revokeFamily(familyId: TokenFamilyId): Promise<void>;
  replace(
    oldToken: RefreshToken,
    refreshToken: RefreshToken,
  ): Promise<void>;
}
