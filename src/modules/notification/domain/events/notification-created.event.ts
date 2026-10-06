import type { DomainEvent } from "../../../../shared/domain/domain-event";
import type { Notification } from "../entity/notification.entity";

/**
 * Raised by the `Notification` aggregate itself when it is created. Persisting
 * a notification and telling the world about it stay separate steps: the
 * application layer drains this event onto the CQRS bus only after the row is
 * committed, which is what drives the websocket push.
 */
export class NotificationCreatedEvent implements DomainEvent {
  readonly occurredAt: Date = new Date();

  constructor(public readonly notification: Notification) { }
}
