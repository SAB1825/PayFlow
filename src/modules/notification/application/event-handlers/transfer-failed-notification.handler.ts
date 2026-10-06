import { EventsHandler, IEventHandler } from "@nestjs/cqrs";
import { TransferFailedEvent } from "../../../transfer/domain/events/transfer-failed.event";
import { Inject } from "@nestjs/common";
import { ACCOUNT_REPOSITORY, type AccountRepositoryPort } from "../../../account/applications/ports/account-repository.port";
import { NotificationType } from "../../domain/entity/notification.entity";
import { ApplicationException, ApplicationExceptionCode } from "../../../../shared/domain/exception/application.exception";
import { NotificationEmitter } from "./notification-emitter";


@EventsHandler(TransferFailedEvent)
export class TransferFailedHandler implements IEventHandler<TransferFailedEvent> {
  constructor(
    @Inject(ACCOUNT_REPOSITORY) private readonly accountRepo: AccountRepositoryPort,
    private readonly notificationEmitter: NotificationEmitter,
  ) { }

  async handle(event: TransferFailedEvent): Promise<void> {
    const fromAccount = await this.accountRepo.findById(event.fromAccountId);
    const toAccount = await this.accountRepo.findById(event.toAccountId);

    if (!fromAccount) {
      throw new ApplicationException(
        'Cannot notify a transfer whose account no longer exists',
        ApplicationExceptionCode.NOT_FOUND,
      );
    }

    // The failure reason comes from arbitrary error messages and the column
    // caps at 500 chars, so keep it bounded.
    const reason = event.reason.slice(0, 300);

    await this.notificationEmitter.emit(
      fromAccount.userId,
      NotificationType.TransferFailed,
      'Transfer failed',
      `₹${event.amount.toRupee()} transfer to ${toAccount?.accountNumber.getvalue() ?? event.toAccountId.getValue()} failed${reason ? `: ${reason}` : ''}`,
    );
  }
}
