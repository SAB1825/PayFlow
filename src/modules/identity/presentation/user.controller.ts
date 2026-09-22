import { Body, Controller, Post } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { RegisterUserDto } from './dtos/register-user.dto';
import { RegisterUserCommand } from '../application/use-cases/register-user/register-user.command';

@Controller('auth')
export class UserController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterUserDto): Promise<void> {
    await this.commandBus.execute<RegisterUserCommand, void>(
      new RegisterUserCommand(dto.name, dto.email, dto.password),
    );
  }
}
