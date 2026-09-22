import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LoginUserCommand } from './login-user.command';
import { User } from '../../../domain/entities/user.entity';
import { Inject } from '@nestjs/common';
import {
  USER_REPOSITORY,
  type UserRepositoryPort,
} from '../../ports/user-repository.port';
import {
  TOKEN_SERVICE,
  type TokenServicePort,
} from '../../ports/token-service.port';
import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepositoryPort,
} from '../../ports/refresh-token.port';
import {
  PASSWORD_HASHER,
  type PasswordHasher,
} from '../../ports/password-service';
import { Email } from '../../../domain/value-object/email.vo';
import { RefreshToken } from '../../../domain/value-object/refresh-token.vo';
import {
  ApplicationException,
  ApplicationExceptionCode,
} from '../../../../../shared/domain/exception/application.exception';

type LoginResponse = {
  user: User;
  accessToken: string;
  refreshToken: string;
};

@CommandHandler(LoginUserCommand)
export class LoginUserHandler implements ICommandHandler<
  LoginUserCommand,
  LoginResponse
> {
  constructor(
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenServicePort,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: RefreshTokenRepositoryPort,
  ) {}

  async execute(command: LoginUserCommand): Promise<LoginResponse> {
    const user = await this.userRepository.findByEmail(
      new Email(command.email),
    );
    if (!user) {
      throw new ApplicationException(
        'Invalid credentials',
        ApplicationExceptionCode.UNAUTHORIZED,
      );
    }

    const isPasswordMatch = await this.passwordHasher.verify(
      command.password,
      user.passwordHash,
    );
    if (!isPasswordMatch) {
      throw new ApplicationException(
        'Invalid credentials',
        ApplicationExceptionCode.UNAUTHORIZED,
      );
    }

    const accessToken = await this.tokenService.generateAccessToken({
      sub: user.id.getValue(),
      email: user.email.getValue(),
    });
    const refreshToken = await this.tokenService.generateRefreshToken({
      sub: user.id.getValue(),
      email: user.email.getValue(),
    });

    const hashedToken = await this.tokenService.hashToken(refreshToken);
    await this.refreshTokenRepository.save(
      RefreshToken.create(
        hashedToken,
        user.id,
        this.tokenService.getRefreshTokenExpiresAt(),
      ),
    );

    return {
      user,
      accessToken,
      refreshToken,
    };
  }
}
