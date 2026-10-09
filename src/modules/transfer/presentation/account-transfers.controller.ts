import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CurrentUser } from '../../../shared/infrastructure/decorators/current-user.decorator';
import { UserDto } from '../../../shared/infrastructure/dto/user.dto';
import { UserThrottlerGaurd } from '../../../shared/infrastructure/gaurds/throttler.gaurd';
import { GetByAccountQuery } from '../applications/queries/get-by-account/get-by-account.command';
import { Transfer } from '../domain/entities/transfer.entity';
import { TransferResponseDto } from './dtos/transfer-response.dto';

/**
 * `GET /accounts/:accountId/transfers` is served from the transfer module (on
 * an `accounts` path prefix) rather than from `AccountController`, so route
 * ownership matches module ownership: no account -> transfer import, and no
 * `GET /transfers/account/:id` competing with `GET /transfers/:transferId`.
 */
@Controller('accounts')
export class AccountTransfersController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get(':accountId/transfers')
  @UseGuards(UserThrottlerGaurd)
  async listByAccount(
    @CurrentUser() user: UserDto,
    @Param('accountId', new ParseUUIDPipe()) accountId: string,
  ): Promise<TransferResponseDto[]> {
    const transfers = await this.queryBus.execute<
      GetByAccountQuery,
      Transfer[]
    >(new GetByAccountQuery(user.sub, accountId));

    return transfers.map((transfer) =>
      TransferResponseDto.fromDomain(transfer),
    );
  }
}
