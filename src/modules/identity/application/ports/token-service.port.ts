export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');

export type JwtPayload = {
  sub: string;
  email: string;
  /** Unique token id. Keeps every issued JWT byte-distinct, otherwise two
   * tokens signed for the same user within the same second are identical and
   * collide on the unique token_hash column during rotation. */
  jti?: string;
};

export interface TokenServicePort {
  generateAccessToken(payload: JwtPayload): Promise<string>;
  generateRefreshToken(payload: JwtPayload): Promise<string>;
  hashToken(token: string): string;
  verifyAccessToken(token: string): Promise<JwtPayload>;
  verifyRefreshToken(token: string): Promise<JwtPayload>;
  getRefreshTokenExpiresAt(): Date;
}
