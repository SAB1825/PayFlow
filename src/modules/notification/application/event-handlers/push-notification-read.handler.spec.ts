import { PushNotificationReadHandler, NOTIFICATION_READ_EVENT } from './push-notification-read.handler';
import { NotificationReadEvent } from '../../domain/events/notification-read.event';
import { Notification, NotificationType } from '../../domain/entity/notification.entity';
import { UserId } from '../../../identity/domain/value-object/user-id.vo';
import type { NotificationGateway } from '../../infrastructure/gateway/notification.gateway';

describe('PushNotificationReadHandler', () => {
  const userId = '11111111-1111-1111-1111-111111111111';

  let gateway: { notifyUser: jest.Mock };
  let handler: PushNotificationReadHandler;

  beforeEach(() => {
    gateway = { notifyUser: jest.fn() };
    handler = new PushNotificationReadHandler(gateway as unknown as NotificationGateway);
  });

  it('tells the owner room that the notification was read', () => {
    const notification = Notification.create(
      UserId.fromString(userId),
      NotificationType.TransferReceived,
      'Money received',
      '₹100 received',
    );
    notification.markRead();

    handler.handle(new NotificationReadEvent(notification));

    expect(gateway.notifyUser).toHaveBeenCalledWith(
      userId,
      NOTIFICATION_READ_EVENT,
      { id: notification.id.getValue(), isRead: true },
    );
  });
});
