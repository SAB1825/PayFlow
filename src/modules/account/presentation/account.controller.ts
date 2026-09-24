import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGaurd } from '../../../shared/infrastructure/gaurds/auth.gaurd';
import { CurrentUser } from '../../../shared/infrastructure/decorators/current-user.decorator';
import { UserDto } from './dtos/user.dto';
import { CreateAccountDto } from './dtos/create-account.dto';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateAccountCommand } from '../applications/use-cases/create-account/create-account.command';

@Controller('account')
export class AccountController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('create')
  @UseGuards(AuthGaurd)
  async create(@CurrentUser() user: UserDto, @Body() dto: CreateAccountDto) {
    await this.commandBus.execute<CreateAccountCommand>(
      new CreateAccountCommand(dto.accountType, user.sub),
    );
  }
}
