import { Inject, Injectable } from "@nestjs/common";
import { and, count, desc, eq } from "drizzle-orm";
import { NotificationRepositoryPort } from "../../application/ports/notification.port";
import { DRIZZLE_DB, type DrizzleDatabase } from "../../../../shared/infrastructure/database/drizzle.types";
import { Notification, NotificationType } from "../../domain/entity/notification.entity";
import { NotificationId } from "../../domain/value-object/notification-id.vo";
import { NotificationDB, notifications } from "../../../../shared/infrastructure/database/schemas";
import { UserId } from "../../../identity/domain/value-object/user-id.vo";


@Injectable()
export class NotificationRepository implements NotificationRepositoryPort {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: DrizzleDatabase,
  ) { }

  async create(notification: Notification): Promise<void> {
    await this.db
      .insert(notifications)
      .values({
        id: notification.id.getValue(),
        userId: notification.userId.getValue(),
        type: notification.type,
        title: notification.title,
        message: notification.message,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
      });
  }

  async findAllByUser(userId: UserId, limit: number): Promise<Notification[]> {
    const rows = await this.db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId.getValue()))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);

    return rows.map((row) => NotificationRepository.toDomain(row));
  }

  async findUnreadCountByUser(userId: UserId): Promise<number> {
    const [result] = await this.db
      .select({ value: count() })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId.getValue()),
          eq(notifications.isRead, false),
        ),
      );

    return result?.value ?? 0;
  }

  async findByIdForUser(id: NotificationId, userId: UserId): Promise<Notification | null> {
    const [row] = await this.db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.id, id.getValue()),
          eq(notifications.userId, userId.getValue()),
        ),
      )
      .limit(1);

    return row ? NotificationRepository.toDomain(row) : null;
  }

  async markRead(id: NotificationId): Promise<void> {
    await this.db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id.getValue()));
  }

  static toDomain(row: NotificationDB): Notification {
    return Notification.reconstitute({
      id: NotificationId.fromString(row.id),
      userId: UserId.fromString(row.userId),
      type: row.type as NotificationType,
      title: row.title,
      message: row.message,
      isRead: row.isRead,
      createdAt: row.createdAt,
    });
  }
}
