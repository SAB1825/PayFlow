import { PushNotificationHandler, NOTIFICATION_EVENT, toPushPayload } from './push-notification.handler';
import { NotificationCreatedEvent } from '../../domain/events/notification-created.event';
import { Notification, NotificationType } from '../../domain/entity/notification.entity';
import { UserId } from '../../../identity/domain/value-object/user-id.vo';
import type { NotificationGateway } from '../../infrastructure/gateway/notification.gateway';

describe('PushNotificationHandler', () => {
  const userId = '11111111-1111-1111-1111-111111111111';

  let gateway: { notifyUser: jest.Mock };
  let handler: PushNotificationHandler;

  beforeEach(() => {
    gateway = { notifyUser: jest.fn() };
    handler = new PushNotificationHandler(gateway as unknown as NotificationGateway);
  });

  function makeNotification(): Notification {
    return Notification.create(
      UserId.fromString(userId),
      NotificationType.TransferSent,
      'Transfer sent',
      '₹100 sent to 22222222222222222222',
    );
  }

  it('pushes the notification to the owner room with the full payload', () => {
    const notification = makeNotification();

    handler.handle(new NotificationCreatedEvent(notification));

    expect(gateway.notifyUser).toHaveBeenCalledWith(
      userId,
      NOTIFICATION_EVENT,
      toPushPayload(notification),
    );

    const [, event, payload] = gateway.notifyUser.mock.calls[0];
    expect(event).toBe('notification');
    expect(payload).toEqual({
      id: notification.id.getValue(),
      type: NotificationType.TransferSent,
      title: 'Transfer sent',
      message: '₹100 sent to 22222222222222222222',
      isRead: false,
      createdAt: notification.createdAt.toISOString(),
    });
  });
});
