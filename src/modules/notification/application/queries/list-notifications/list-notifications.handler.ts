import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { ListNotificationsQuery } from "./list-notifications.query";
import { NOTIFICATION_REPOSITORY, type NotificationRepositoryPort } from "../../ports/notification.port";
import { Notification } from "../../../domain/entity/notification.entity";
import { UserId } from "../../../../identity/domain/value-object/user-id.vo";

export const LIST_NOTIFICATIONS_LIMIT = 50;

@QueryHandler(ListNotificationsQuery)
export class ListNotificationsHandler implements IQueryHandler<
  ListNotificationsQuery,
  Notification[]
> {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepo: NotificationRepositoryPort,
  ) { }

  async execute(query: ListNotificationsQuery): Promise<Notification[]> {
    return this.notificationRepo.findAllByUser(
      UserId.fromString(query.userId),
      LIST_NOTIFICATIONS_LIMIT,
    );
  }
}
