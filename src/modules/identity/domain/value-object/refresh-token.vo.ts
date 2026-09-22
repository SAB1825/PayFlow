import { UserId } from './user-id.vo';

export class RefreshToken {
  private constructor(
    private readonly _tokenHash: string,
    private readonly _userId: UserId,
    private readonly _expiresAt: Date,
  ) {}

  static create(
    tokenHash: string,
    userId: UserId,
    expiresAt: Date,
  ): RefreshToken {
    return new RefreshToken(tokenHash, userId, expiresAt);
  }

  get tokenHash(): string {
    return this._tokenHash;
  }

  get userId(): UserId {
    return this._userId;
  }

  get expiresAt(): Date {
    return this._expiresAt;
  }
}