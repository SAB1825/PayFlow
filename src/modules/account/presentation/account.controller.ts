import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGaurd } from '../../../shared/infrastructure/gaurds/auth.gaurd';
import { CurrentUser } from '../../../shared/infrastructure/decorators/current-user.decorator';
import { UserDto } from './dtos/user.dto';
import { CreateAccountDto } from './dtos/create-account.dto';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateAccountCommand } from '../applications/use-cases/create-account/create-account.command';
import { AccountResponseDto } from './dtos/account-response.dto';
import { GetMyAccountsQuery } from '../applications/queries/get-accounts/get-accounts.query';
import { Account } from '../domain/entities/account.entity';
import { GetAccountQuery } from '../applications/queries/get-account/get-account.query';

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

  @Get()
  @UseGuards(AuthGaurd)
  async getMyAccounts(
    @CurrentUser() user: UserDto,
  ): Promise<AccountResponseDto[]> {
    const accounts = await this.queryBus.execute<GetMyAccountsQuery, Account[]>(
      new GetMyAccountsQuery(user.sub),
    );

    return accounts.map((account) => AccountResponseDto.fromDomain(account));
  }

  @Get(':accountNumber')
  @UseGuards(AuthGaurd)
  async getAccount(
    @CurrentUser() user: UserDto,
    @Param('accountNumber') accountNumber: string,
  ): Promise<AccountResponseDto> {
    const account = await this.queryBus.execute<GetAccountQuery, Account>(
      new GetAccountQuery(user.sub, accountNumber),
    );

    return AccountResponseDto.fromDomain(account);
  }
}
