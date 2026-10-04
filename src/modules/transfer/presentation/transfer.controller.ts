import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  UseGuards,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { AuthGaurd } from '../../../shared/infrastructure/gaurds/auth.gaurd';
import { TransferResponseDto } from './dtos/transfer-response.dto';
import { CurrentUser } from '../../../shared/infrastructure/decorators/current-user.decorator';
import { TransferDto } from './dtos/transfer.dto';
import { UserDto } from '../../../shared/infrastructure/dto/user.dto';
import { TransferCommand } from '../applications/use-cases/transfer/transfer.command';
import { Transfer } from '../domain/entities/transfer.entity';
import { GetByIdQuery } from '../applications/queries/get-by-id/get-by-id.query';
import { GetByAccountQuery } from '../applications/queries/get-by-account/get-by-account.command';

@Controller('transfer')
export class TransferController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) { }

  @Post()
  async transfer(
    @CurrentUser() user: UserDto,
    @Headers('idempotency-key') key: string,
    @Body() dto: TransferDto,
  ): Promise<TransferResponseDto> {
    const transfer = await this.commandBus.execute<TransferCommand, Transfer>(
      new TransferCommand(
        user.sub,
        dto.fromAccountNumber,
        dto.toAccountNumber,
        key,
        dto.amount,
      ),
    );

    return TransferResponseDto.fromDomain(transfer);
  }
  @Get('account/:accountId')
  async getByAccId(
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
  @Get(':transferId')
  async getById(
    @CurrentUser() user: UserDto,
    @Param('transferId', new ParseUUIDPipe()) transferId: string,
  ): Promise<TransferResponseDto> {
    const transfer = await this.queryBus.execute<GetByIdQuery, Transfer>(
      new GetByIdQuery(user.sub, transferId),
    );

    return TransferResponseDto.fromDomain(transfer);
  }
}
