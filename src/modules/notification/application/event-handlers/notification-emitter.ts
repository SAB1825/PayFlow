import { EventBus } from "@nestjs/cqrs";
import { Inject, Injectable } from "@nestjs/common";
import { NOTIFICATION_REPOSITORY, type NotificationRepositoryPort } from "../ports/notification.port";
import { Notification, NotificationType } from "../../domain/entity/notification.entity";
import { UserId } from "../../../identity/domain/value-object/user-id.vo";

/**
 * Creates notifications on behalf of event handlers.
 *
 * `Notification.create()` raises a `NotificationCreatedEvent` on the
 * aggregate; this service commits the row first and only then drains the
 * aggregate's events onto the CQRS bus. The websocket push lives in a
 * separate event handler, so nothing here knows about sockets — and a
 * notification that never reaches the database is never announced.
 */
@Injectable()
export class NotificationEmitter {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY) private readonly notificationRepo: NotificationRepositoryPort,
    private readonly eventBus: EventBus,
  ) { }

  async emit(
    userId: UserId,
    type: NotificationType,
    title: string,
    message: string,
  ): Promise<Notification> {
    const notification = Notification.create(userId, type, title, message);

    await this.notificationRepo.create(notification);
    this.publishDomainEvents(notification);

    return notification;
  }

  private publishDomainEvents(notification: Notification): void {
    for (const event of notification.pullDomainEvents()) {
      this.eventBus.publish(event);
    }
  }
}
