import type { DomainEvent } from "../../../../shared/domain/domain-event";
import type { Notification } from "../entity/notification.entity";

/**
 * Raised by the `Notification` aggregate when it is read, so other devices of
 * the same user can be told to drop their badge without polling.
 */
export class NotificationReadEvent implements DomainEvent {
  readonly occurredAt: Date = new Date();

  constructor(public readonly notification: Notification) { }
}
