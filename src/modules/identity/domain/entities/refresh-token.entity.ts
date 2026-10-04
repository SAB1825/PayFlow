import { AggregateRoot } from '../../../../shared/domain/aggregate-root';
import { DomainException } from '../../../../shared/domain/exception/domain.exception';
import { UserId } from '../value-object/user-id.vo';
import { RefreshTokenId } from '../value-object/refresh-token-id.vo';
import { TokenFamilyId } from '../value-object/token-family-id.vo';

interface RefreshTokenProps {
  id: RefreshTokenId;
  userId: UserId;
  familyId: TokenFamilyId;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
}

export class RefreshToken extends AggregateRoot {
  private _id: RefreshTokenId;
  private _userId: UserId;
  private _familyId: TokenFamilyId;
  private _tokenHash: string;
  private _expiresAt: Date;
  private _revokedAt: Date | null;
  private _createdAt: Date;

  private constructor(props: RefreshTokenProps) {
    super();
    this._id = props.id;
    this._userId = props.userId;
    this._familyId = props.familyId;
    this._tokenHash = props.tokenHash;
    this._expiresAt = props.expiresAt;
    this._revokedAt = props.revokedAt;
    this._createdAt = props.createdAt;
  }

  /**
   * Starts a new rotation chain. Pass a fresh `TokenFamilyId` on login, or the
   * family id of the token being rotated to keep the chain intact.
   */
  static create(
    userId: UserId,
    familyId: TokenFamilyId,
    tokenHash: string,
    expiresAt: Date,
  ): RefreshToken {
    if (!tokenHash || tokenHash.trim().length === 0) {
      throw new DomainException('Refresh token hash is required');
    }
    if (expiresAt.getTime() <= Date.now()) {
      throw new DomainException('Refresh token must expire in the future');
    }

    return new RefreshToken({
      id: RefreshTokenId.create(),
      userId,
      familyId,
      tokenHash,
      expiresAt,
      revokedAt: null,
      createdAt: new Date(),
    });
  }

  static reconstitute(props: RefreshTokenProps): RefreshToken {
    return new RefreshToken(props);
  }

  revoke(at: Date = new Date()): void {
    if (this._revokedAt !== null) return;
    this._revokedAt = at;
  }

  isRevoked(): boolean {
    return this._revokedAt !== null;
  }

  isExpired(at: Date = new Date()): boolean {
    return this._expiresAt.getTime() <= at.getTime();
  }

  belongsTo(userId: UserId): boolean {
    return this._userId.equals(userId);
  }

  matches(tokenHash: string): boolean {
    return this._tokenHash === tokenHash;
  }

  get id(): RefreshTokenId {
    return this._id;
  }

  get userId(): UserId {
    return this._userId;
  }

  get familyId(): TokenFamilyId {
    return this._familyId;
  }

  get tokenHash(): string {
    return this._tokenHash;
  }

  get expiresAt(): Date {
    return this._expiresAt;
  }

  get revokedAt(): Date | null {
    return this._revokedAt;
  }

  get createdAt(): Date {
    return this._createdAt;
  }
}
