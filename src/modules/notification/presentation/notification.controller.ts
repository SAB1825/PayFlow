import { Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { CurrentUser } from "../../../shared/infrastructure/decorators/current-user.decorator";
import { UserDto } from "../../../shared/infrastructure/dto/user.dto";
import { ListNotificationsQuery } from "../application/queries/list-notifications/list-notifications.query";
import { UnreadCountQuery } from "../application/queries/unread-count/unread-count.query";
import { MarkNotificationReadCommand } from "../application/use-cases/mark-notification-read/mark-notification-read.command";
import { Notification } from "../domain/entity/notification.entity";
import { NotificationResponseDto } from "./dtos/notification-response.dto";


@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) { }

  @Get()
  @HttpCode(HttpStatus.OK)
  async list(@CurrentUser() user: UserDto): Promise<NotificationResponseDto[]> {
    const notifications = await this.queryBus.execute<ListNotificationsQuery, Notification[]>(
      new ListNotificationsQuery(user.sub),
    );

    return notifications.map((notification) =>
      NotificationResponseDto.fromDomain(notification),
    );
  }

  @Get('unread-count')
  @HttpCode(HttpStatus.OK)
  async unreadCount(@CurrentUser() user: UserDto): Promise<{ unread: number }> {
    const unread = await this.queryBus.execute<UnreadCountQuery, number>(
      new UnreadCountQuery(user.sub),
    );

    return { unread };
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  async markRead(
    @CurrentUser() user: UserDto,
    @Param('id', new ParseUUIDPipe()) notificationId: string,
  ): Promise<void> {
    await this.commandBus.execute<MarkNotificationReadCommand, void>(
      new MarkNotificationReadCommand(notificationId, user.sub),
    );
  }
}
