import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { DrizzleModule } from '../../shared/infrastructure/database/drizzle.module';
import { AccountModule } from '../account/account.module';
import { TransferController } from './presentation/transfer.controller';
import { CommandHandlers } from './applications/use-cases';
import { TRANSFER_REPOSITORY } from './applications/ports/transfer.repository.port';
import { TransferRepository } from './infrastructure/transfer.repository';
import { QueryHandlers } from './applications/queries';

@Module({
  imports: [CqrsModule, DrizzleModule, AccountModule],
  controllers: [TransferController],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    { provide: TRANSFER_REPOSITORY, useClass: TransferRepository },
  ],
})
export class TransferModule { }
