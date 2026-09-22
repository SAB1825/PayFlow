import { RefreshToken } from '../../domain/value-object/refresh-token.vo';
import { UserId } from '../../domain/value-object/user-id.vo';

export type TokenFromDb = {
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date;
};

export const REFRESH_TOKEN_REPOSITORY = Symbol('REFRESH_TOKEN_REPOSITORY');

export interface RefreshTokenRepositoryPort {
  save(refreshToken: RefreshToken): Promise<void>;
  findToken(userId: UserId): Promise<RefreshToken | null>;
  revokeToken(refreshToken: RefreshToken): Promise<void>;
  replace(oldToken: RefreshToken, refreshToken: RefreshToken): Promise<void>;
}
