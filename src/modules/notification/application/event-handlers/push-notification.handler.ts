import { EventsHandler, IEventHandler } from "@nestjs/cqrs";
import { NotificationCreatedEvent } from "../../domain/events/notification-created.event";
import { Notification } from "../../domain/entity/notification.entity";
import { NotificationGateway } from "../../infrastructure/gateway/notification.gateway";

export const NOTIFICATION_EVENT = 'notification';

export interface NotificationPushPayload {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export function toPushPayload(notification: Notification): NotificationPushPayload {
  return {
    id: notification.id.getValue(),
    type: notification.type,
    title: notification.title,
    message: notification.message,
    isRead: notification.isRead,
    createdAt: notification.createdAt.toISOString(),
  };
}

/**
 * The only place that touches the websocket: a persisted notification has
 * become a `NotificationCreatedEvent`, now fan it out to the owner's room.
 */
@EventsHandler(NotificationCreatedEvent)
export class PushNotificationHandler implements IEventHandler<NotificationCreatedEvent> {
  constructor(private readonly gateway: NotificationGateway) { }

  handle(event: NotificationCreatedEvent): void {
    const notification = event.notification;

    this.gateway.notifyUser(
      notification.userId.getValue(),
      NOTIFICATION_EVENT,
      toPushPayload(notification),
    );
  }
}
