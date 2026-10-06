import { Inject, Injectable } from "@nestjs/common";
import { NOTIFICATION_REPOSITORY, type NotificationRepositoryPort } from "../ports/notification.port";
import { Notification, NotificationType } from "../../domain/entity/notification.entity";
import { UserId } from "../../../identity/domain/value-object/user-id.vo";
import { NotificationGateway } from "../../infrastructure/gateway/notification.gateway";

export const NOTIFICATION_EVENT = 'notification';

export interface NotificationPushPayload {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

/**
 * Persists a notification and pushes it over the websocket in one step, so
 * callers never have to remember half of the flow. If the socket is not
 * connected the row is still stored — the client picks it up from the REST
 * endpoints on its next fetch.
 */
@Injectable()
export class NotificationEmitter {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY) private readonly notificationRepo: NotificationRepositoryPort,
    private readonly gateway: NotificationGateway,
  ) { }

  async emit(
    userId: UserId,
    type: NotificationType,
    title: string,
    message: string,
  ): Promise<Notification> {
    const notification = Notification.create(userId, type, title, message);

    await this.notificationRepo.create(notification);
    this.gateway.notifyUser(userId.getValue(), NOTIFICATION_EVENT, NotificationEmitter.toPayload(notification));

    return notification;
  }

  static toPayload(notification: Notification): NotificationPushPayload {
    return {
      id: notification.id.getValue(),
      type: notification.type,
      title: notification.title,
      message: notification.message,
      isRead: notification.isRead,
      createdAt: notification.createdAt.toISOString(),
    };
  }
}
