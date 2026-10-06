import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { MarkNotificationReadCommand } from "./mark-notification-read.command";
import { NOTIFICATION_REPOSITORY, type NotificationRepositoryPort } from "../../ports/notification.port";
import { NotificationId } from "../../../domain/value-object/notification-id.vo";
import { UserId } from "../../../../identity/domain/value-object/user-id.vo";
import { ApplicationException, ApplicationExceptionCode } from "../../../../../shared/domain/exception/application.exception";

@CommandHandler(MarkNotificationReadCommand)
export class MarkNotificationReadHandler implements ICommandHandler<
  MarkNotificationReadCommand,
  void
> {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepo: NotificationRepositoryPort,
  ) { }

  async execute(command: MarkNotificationReadCommand): Promise<void> {
    const notification = await this.notificationRepo.findByIdForUser(
      NotificationId.fromString(command.notificationId),
      UserId.fromString(command.userId),
    );

    if (!notification) {
      throw new ApplicationException(
        'Notification not found',
        ApplicationExceptionCode.NOT_FOUND,
      );
    }

    if (notification.isRead) return;

    notification.markRead();
    await this.notificationRepo.markRead(notification.id);
  }
}
