import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { LogOutCommand } from "./log-out.command";
import { Inject } from "@nestjs/common";
import { TOKEN_SERVICE, type TokenServicePort } from "../../ports/token-service.port";
import { REFRESH_TOKEN_REPOSITORY, type RefreshTokenRepositoryPort } from "../../ports/refresh-token.port";
import { ApplicationException, ApplicationExceptionCode } from "../../../../../shared/domain/exception/application.exception";
import { UserId } from "../../../domain/value-object/user-id.vo";



@CommandHandler(LogOutCommand)
export class LogOutHandler implements ICommandHandler<LogOutCommand, void> {
  constructor(
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: TokenServicePort,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: RefreshTokenRepositoryPort
  ) { }

  async execute(command: LogOutCommand): Promise<void> {
    const hash = this.tokenService.hashToken(command.rawToken);
    const token = await this.refreshTokenRepository.findByTokenHash(hash);
    const userId = UserId.fromString(command.userId);
    if (!token) throw new ApplicationException("Invalid refresh-token", ApplicationExceptionCode.NOT_FOUND);
    if (!token.userId.equals(userId)) throw new ApplicationException("You are not authorized to perform this.", ApplicationExceptionCode.UNAUTHORIZED);
    await this.refreshTokenRepository.revokeToken(token)
  }
}
