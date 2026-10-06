import { Notification } from "../../domain/entity/notification.entity";

export class NotificationResponseDto {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;

  static fromDomain(notification: Notification): NotificationResponseDto {
    const dto = new NotificationResponseDto();
    dto.id = notification.id.getValue();
    dto.type = notification.type;
    dto.title = notification.title;
    dto.message = notification.message;
    dto.isRead = notification.isRead;
    dto.createdAt = notification.createdAt.toISOString();

    return dto;
  }
}
