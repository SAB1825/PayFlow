import { EventsHandler, IEventHandler } from "@nestjs/cqrs";
import { NotificationReadEvent } from "../../domain/events/notification-read.event";
import { NotificationGateway } from "../../infrastructure/gateway/notification.gateway";

export const NOTIFICATION_READ_EVENT = 'notification:read';

export interface NotificationReadPushPayload {
  id: string;
  isRead: true;
}

/**
 * Keeps every socket of the same user in sync: when one tab marks a
 * notification read, the others get `notification:read` instead of having to
 * poll the unread count.
 */
@EventsHandler(NotificationReadEvent)
export class PushNotificationReadHandler implements IEventHandler<NotificationReadEvent> {
  constructor(private readonly gateway: NotificationGateway) { }

  handle(event: NotificationReadEvent): void {
    const notification = event.notification;

    this.gateway.notifyUser(
      notification.userId.getValue(),
      NOTIFICATION_READ_EVENT,
      { id: notification.id.getValue(), isRead: true },
    );
  }
}
