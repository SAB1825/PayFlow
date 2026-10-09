import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CurrentUser } from '../../../shared/infrastructure/decorators/current-user.decorator';
import { CreateAccountDto } from './dtos/create-account.dto';
import { CreateAccountCommand } from '../applications/use-cases/create-account/create-account.command';
import { AccountResponseDto } from './dtos/account-response.dto';
import { GetMyAccountsQuery } from '../applications/queries/get-accounts/get-accounts.query';
import { Account } from '../domain/entities/account.entity';
import { GetAccountQuery } from '../applications/queries/get-account/get-account.query';
import { UserDto } from '../../../shared/infrastructure/dto/user.dto';
import { resourceLocation } from '../../../shared/infrastructure/http/location';

@Controller('accounts')
export class AccountController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /** POST /accounts — 201 with the created account and its `Location`. */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: UserDto,
    @Body() dto: CreateAccountDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AccountResponseDto> {
    const account = await this.commandBus.execute<CreateAccountCommand, Account>(
      new CreateAccountCommand(dto.accountType, user.sub),
    );

    const created = AccountResponseDto.fromDomain(account);
    res.location(resourceLocation(req, created.id));
    return created;
  }

  @Get()
  async getMyAccounts(
    @CurrentUser() user: UserDto,
  ): Promise<AccountResponseDto[]> {
    const accounts = await this.queryBus.execute<GetMyAccountsQuery, Account[]>(
      new GetMyAccountsQuery(user.sub),
    );
    return accounts.map((account) => AccountResponseDto.fromDomain(account));
  }

  @Get(':accountId')
  async getAccount(
    @CurrentUser() user: UserDto,
    @Param('accountId', new ParseUUIDPipe()) accountId: string,
  ): Promise<AccountResponseDto> {
    const account = await this.queryBus.execute<GetAccountQuery, Account>(
      new GetAccountQuery(user.sub, accountId),
    );

    return AccountResponseDto.fromDomain(account);
  }
}
