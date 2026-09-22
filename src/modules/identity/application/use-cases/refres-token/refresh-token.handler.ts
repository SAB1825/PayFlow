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
import { RefreshToken } from '../../../domain/value-object/refresh-token.vo';

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
  ) {}

  async execute(command: RefreshTokenCommand): Promise<RefreshTokenResult> {
    const payload = await this.verifySignature(command.refreshToken);
    const user = await this.getUser(payload.sub);
    const dbToken = await this.getActiveSession(user.id);

    await this.assertNotExpired(dbToken);
    await this.assertNotReused(dbToken, command.refreshToken);

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

  private async getActiveSession(userId: UserId) {
    const dbToken = await this.refreshTokenRepo.findToken(userId);
    if (!dbToken) {
      throw new ApplicationException(
        'Invalid session or refresh token',
        ApplicationExceptionCode.UNAUTHORIZED,
      );
    }
    return dbToken;
  }

  //Throw error if token is not expired
  private async assertNotExpired(dbToken: RefreshToken): Promise<void> {
    if (dbToken.expiresAt < new Date()) {
      await this.refreshTokenRepo.revokeToken(dbToken);
      throw new ApplicationException(
        'Session expired, please login again',
        ApplicationExceptionCode.UNAUTHORIZED,
      );
    }
  }

  private async assertNotReused(
    dbToken: RefreshToken,
    rawToken: string,
  ): Promise<void> {
    const isValidToken = await this.tokenService.verifyToken(
      dbToken.tokenHash,
      rawToken,
    );
    if (isValidToken) return;
    await this.refreshTokenRepo.revokeToken(dbToken);
    throw new ApplicationException(
      'Invalid refresh token',
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
    const tokenHash = await this.tokenService.hashToken(refreshToken);
    const expiresAt = this.tokenService.getRefreshTokenExpiresAt();

    await this.refreshTokenRepo.replace(
      oldToken,
      RefreshToken.create(tokenHash, user.id, expiresAt),
    );

    return { user, accessToken, refreshToken };
  }
}
