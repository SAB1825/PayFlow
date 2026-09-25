import { Body, Controller, Headers, Post, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { AuthGaurd } from '../../../shared/infrastructure/gaurds/auth.gaurd';
import { TransferResponseDto } from './dtos/transfer-response.dto';
import { CurrentUser } from '../../../shared/infrastructure/decorators/current-user.decorator';
import { TransferDto } from './dtos/transfer.dto';
import { UserDto } from '../../../shared/infrastructure/dto/user.dto';
import { TransferCommand } from '../applications/use-cases/transfer/transfer.command';
import { Transfer } from '../domain/entities/transfer.entity';

@Controller('transfer')
export class TransferController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Post()
  @UseGuards(AuthGaurd)
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
}
