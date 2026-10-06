import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AccountModule } from '../account/account.module';
import { NotificationController } from './presentation/notification.controller';
import { NotificationGateway } from './infrastructure/gateway/notification.gateway';
import { NotificationRepository } from './infrastructure/repository/notification.repository';
import { NOTIFICATION_REPOSITORY } from './application/ports/notification.port';
import { EventHandlers } from './application/event-handlers';
import { NotificationEmitter } from './application/event-handlers/notification-emitter';
import { CommandHandlers } from './application/use-cases';
import { QueryHandlers } from './application/queries';

@Module({
  imports: [CqrsModule, AccountModule],
  controllers: [NotificationController],
  providers: [
    ...EventHandlers,
    ...CommandHandlers,
    ...QueryHandlers,
    NotificationEmitter,
    NotificationGateway,
    { provide: NOTIFICATION_REPOSITORY, useClass: NotificationRepository },
  ],
  exports: [NotificationGateway],
})
export class NotificationModule { }
