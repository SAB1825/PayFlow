import { RefreshToken } from '../../domain/value-object/refresh-token.vo';

export const REFRESH_TOKEN_REPOSITORY = Symbol(
  'REFRESH_TOKEN_REPOSITORY',
);

export interface RefreshTokenRepositoryPort {
  save(refreshToken: RefreshToken): Promise<void>;
}