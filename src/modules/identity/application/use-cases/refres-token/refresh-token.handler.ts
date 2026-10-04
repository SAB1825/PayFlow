import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { RefreshTokenCommand } from './refresh-token.command';
import { User } from '../../../domain/entities/user.entity';
import {
  USER_REPOSITORY,
  type UserRepositoryPort,
} from '../../ports/user-repository.port';
import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepositoryPort,
} from '../../ports/refresh-token.port';
import {
  JwtPayload,
  TOKEN_SERVICE,
  type TokenServicePort,
} from '../../ports/token-service.port';
import {
  ApplicationException,
  ApplicationExceptionCode,
} from '../../../../../shared/domain/exception/application.exception';
import { UserId } from '../../../domain/value-object/user-id.vo';
import { RefreshToken } from '../../../domain/entities/refresh-token.entity';

export interface RefreshTokenResult {
  user: User;
  accessToken: string;
  refreshToken: string;
}

@CommandHandler(RefreshTokenCommand)
export class RefreshTokenHandler implements ICommandHandler<
  RefreshTokenCommand,
  RefreshTokenResult
> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepo: RefreshTokenRepositoryPort,
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: TokenServicePort,
  ) { }

  async execute(command: RefreshTokenCommand): Promise<RefreshTokenResult> {
    const payload = await this.verifySignature(command.refreshToken);
    const dbToken = await this.getSessionByToken(command.refreshToken);

    // A revoked token means the client replayed an already rotated token, so the
    // whole family is compromised and must not be usable again.
    await this.assertNotReused(dbToken);

    const user = await this.getUser(payload.sub);
    this.assertBelongsTo(dbToken, user);
    await this.assertNotExpired(dbToken);

    return this.rotate(user, dbToken);
  }

  private async verifySignature(rawToken: string): Promise<JwtPayload> {
    try {
      return await this.tokenService.verifyRefreshToken(rawToken);
    } catch {
      throw new ApplicationException(
        'Invalid or expired refresh token',
        ApplicationExceptionCode.UNAUTHORIZED,
      );
    }
  }

  private async getSessionByToken(rawToken: string): Promise<RefreshToken> {
    const tokenHash = this.tokenService.hashToken(rawToken);
    const dbToken = await this.refreshTokenRepo.findByTokenHash(tokenHash);
    if (!dbToken) {
      throw new ApplicationException(
        'Invalid refresh token',
        ApplicationExceptionCode.UNAUTHORIZED,
      );
    }
    return dbToken;
  }

  private async getUser(userId: string): Promise<User> {
    const user = await this.userRepository.findById(UserId.fromString(userId));
    if (!user) {
      throw new ApplicationException(
        'User not found for this given id',
        ApplicationExceptionCode.NOT_FOUND,
      );
    }
    return user;
  }

  // The stored token row is the source of truth: it must belong to the subject
  // the signed token claims.
  private assertBelongsTo(dbToken: RefreshToken, user: User): void {
    if (!dbToken.belongsTo(user.id)) {
      throw new ApplicationException(
        'Invalid refresh token',
        ApplicationExceptionCode.UNAUTHORIZED,
      );
    }
  }

  private async assertNotReused(dbToken: RefreshToken): Promise<void> {
    if (!dbToken.isRevoked()) return;

    await this.refreshTokenRepo.revokeFamily(dbToken.familyId);
    throw new ApplicationException(
      'Refresh token reuse detected, please login again',
      ApplicationExceptionCode.UNAUTHORIZED,
    );
  }

  //Throw error if token is not expired
  private async assertNotExpired(dbToken: RefreshToken): Promise<void> {
    if (!dbToken.isExpired()) return;

    await this.refreshTokenRepo.revokeFamily(dbToken.familyId);
    throw new ApplicationException(
      'Session expired, please login again',
      ApplicationExceptionCode.UNAUTHORIZED,
    );
  }

  private async rotate(
    user: User,
    oldToken: RefreshToken,
  ): Promise<RefreshTokenResult> {
    const accessToken = await this.tokenService.generateAccessToken({
      sub: user.id.getValue(),
      email: user.email.getValue(),
    });
    const refreshToken = await this.tokenService.generateRefreshToken({
      sub: user.id.getValue(),
      email: user.email.getValue(),
    });
    const tokenHash = this.tokenService.hashToken(refreshToken);
    const expiresAt = this.tokenService.getRefreshTokenExpiresAt();

    // The new token stays in the same family so a later replay of any token in
    // this chain still triggers family-wide revocation.
    const rotatedToken = RefreshToken.create(
      user.id,
      oldToken.familyId,
      tokenHash,
      expiresAt,
    );

    await this.refreshTokenRepo.replace(oldToken, rotatedToken);

    return { user, accessToken, refreshToken };
  }
}
