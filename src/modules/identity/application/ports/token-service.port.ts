export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');

export type JwtPayload = {
  sub: string;
  email: string;
};

export interface TokenServicePort {
  generateAccessToken(payload: JwtPayload): Promise<string>;
  generateRefreshToken(payload: JwtPayload): Promise<string>;
  hashToken(token: string): Promise<string>;
  verifyToken(hash: string, token: string): Promise<boolean>;
  verifyAccessToken(token: string): Promise<JwtPayload>;
  verifyRefreshToken(token: string): Promise<JwtPayload>;
  getRefreshTokenExpiresAt(): Date;
}
