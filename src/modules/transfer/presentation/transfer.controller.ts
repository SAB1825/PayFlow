import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { TransferResponseDto } from './dtos/transfer-response.dto';
import { CurrentUser } from '../../../shared/infrastructure/decorators/current-user.decorator';
import { TransferDto } from './dtos/transfer.dto';
import { UserDto } from '../../../shared/infrastructure/dto/user.dto';
import { TransferCommand } from '../applications/use-cases/transfer/transfer.command';
import { Transfer } from '../domain/entities/transfer.entity';
import { GetByIdQuery } from '../applications/queries/get-by-id/get-by-id.query';
import { UserThrottlerGaurd } from '../../../shared/infrastructure/gaurds/throttler.gaurd';
import { resourceLocation } from '../../../shared/infrastructure/http/location';

@Controller('transfers')
export class TransferController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  /** POST /transfers — 201 with the created transfer and its `Location`. */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(UserThrottlerGaurd)
  async transfer(
    @CurrentUser() user: UserDto,
    @Headers('idempotency-key') key: string,
    @Body() dto: TransferDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
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

    const created = TransferResponseDto.fromDomain(transfer);
    res.location(resourceLocation(req, created.id));
    return created;
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
