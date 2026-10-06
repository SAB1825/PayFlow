import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { UnreadCountQuery } from "./unread-count.query";
import { NOTIFICATION_REPOSITORY, type NotificationRepositoryPort } from "../../ports/notification.port";
import { UserId } from "../../../../identity/domain/value-object/user-id.vo";

@QueryHandler(UnreadCountQuery)
export class UnreadCountHandler implements IQueryHandler<
  UnreadCountQuery,
  number
> {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepo: NotificationRepositoryPort,
  ) { }

  async execute(query: UnreadCountQuery): Promise<number> {
    return this.notificationRepo.findUnreadCountByUser(
      UserId.fromString(query.userId),
    );
  }
}
