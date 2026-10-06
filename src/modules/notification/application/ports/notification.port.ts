import { Notification } from "../../domain/entity/notification.entity";
import { NotificationId } from "../../domain/value-object/notification-id.vo";
import { UserId } from "../../../identity/domain/value-object/user-id.vo";


export const NOTIFICATION_REPOSITORY = Symbol("NOTIFICATION_REPOSITORY");


export interface NotificationRepositoryPort {
  create(notification: Notification): Promise<void>;
  findAllByUser(userId: UserId, limit: number): Promise<Notification[]>;
  findUnreadCountByUser(userId: UserId): Promise<number>;
  findByIdForUser(id: NotificationId, userId: UserId): Promise<Notification | null>;
  markRead(id: NotificationId): Promise<void>;
}
