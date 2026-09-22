import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { UserController } from './presentation/user.controller';
import { CommandHandlers } from './application/use-cases';
import { PASSWORD_HASHER } from './application/ports/password-service';
import { USER_REPOSITORY } from './application/ports/user-repository.port';
import { Argon2PasswordHasher } from './infrastructure/services/password.service';
import { UserRepository } from './infrastructure/repositories/user.repository';
import { TOKEN_SERVICE } from './application/ports/token-service.port';
import { TokenService } from './infrastructure/services/token.service';
import { REFRESH_TOKEN_REPOSITORY } from './application/ports/refresh-token.port';
import { RefreshTokenRepository } from './infrastructure/repositories/refresh-token.repository';
import { QueryHandlers } from './application/queries';

@Module({
  imports: [CqrsModule, JwtModule.register({})],
  controllers: [UserController],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    {
      provide: PASSWORD_HASHER,
      useClass: Argon2PasswordHasher,
    },
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository,
    },
    {
      provide: TOKEN_SERVICE,
      useClass: TokenService,
    },
    {
      provide: REFRESH_TOKEN_REPOSITORY,
      useClass: RefreshTokenRepository,
    },
  ],
})
export class UserModule {}
