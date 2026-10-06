import { EventsHandler, IEventHandler } from "@nestjs/cqrs";
import { TransferCompletedEvent } from "../../../transfer/domain/events/transfer-completed.event";
import { Inject } from "@nestjs/common";
import { ACCOUNT_REPOSITORY, type AccountRepositoryPort } from "../../../account/applications/ports/account-repository.port";
import { NotificationType } from "../../domain/entity/notification.entity";
import { ApplicationException, ApplicationExceptionCode } from "../../../../shared/domain/exception/application.exception";
import { NotificationEmitter } from "./notification-emitter";


@EventsHandler(TransferCompletedEvent)
export class TransferCompletedHandler implements IEventHandler<TransferCompletedEvent> {
  constructor(
    @Inject(ACCOUNT_REPOSITORY) private readonly accountRepo: AccountRepositoryPort,
    private readonly notificationEmitter: NotificationEmitter,
  ) { }

  async handle(event: TransferCompletedEvent): Promise<void> {
    const fromAccount = await this.accountRepo.findById(event.fromAccountId);
    const toAccount = await this.accountRepo.findById(event.toAccountId);

    if (!fromAccount || !toAccount) {
      throw new ApplicationException(
        'Cannot notify a transfer whose accounts no longer exist',
        ApplicationExceptionCode.NOT_FOUND,
      );
    }

    await this.notificationEmitter.emit(
      fromAccount.userId,
      NotificationType.TransferSent,
      'Transfer sent',
      `₹${event.amount.toRupee()} sent to ${toAccount.accountNumber.getvalue()}`,
    );

    await this.notificationEmitter.emit(
      toAccount.userId,
      NotificationType.TransferReceived,
      'Money received',
      `₹${event.amount.toRupee()} received from ${fromAccount.accountNumber.getvalue()}`,
    );
  }
}
