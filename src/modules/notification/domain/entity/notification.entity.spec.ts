import { Notification, NotificationType } from './notification.entity';
import { NotificationCreatedEvent } from '../events/notification-created.event';
import { UserId } from '../../../identity/domain/value-object/user-id.vo';

describe('Notification aggregate domain events', () => {
  const userId = UserId.fromString('11111111-1111-1111-1111-111111111111');

  it('raises NotificationCreatedEvent when created', () => {
    const notification = Notification.create(
      userId,
      NotificationType.TransferSent,
      'Transfer sent',
      '₹100 sent',
    );

    const events = notification.pullDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(NotificationCreatedEvent);
    expect(events[0].notification).toBe(notification);
    expect((events[0] as any).occurredAt).toBeInstanceOf(Date);
  });

  it('pullDomainEvents drains, so the same event is never re-published', () => {
    const notification = Notification.create(
      userId,
      NotificationType.TransferSent,
      'Transfer sent',
      '₹100 sent',
    );

    notification.pullDomainEvents();
    expect(notification.pullDomainEvents()).toHaveLength(0);
  });

  it('raises NotificationReadEvent once when marked read', () => {
    const notification = Notification.create(
      userId,
      NotificationType.TransferSent,
      'Transfer sent',
      '₹100 sent',
    );
    notification.pullDomainEvents();

    notification.markRead();
    expect(notification.isRead).toBe(true);
    expect(notification.pullDomainEvents()).toHaveLength(1);

    notification.markRead(); // second call is a no-op
    expect(notification.pullDomainEvents()).toHaveLength(0);
  });

  it('reconstituted notifications raise no events (loading is not an event)', () => {
    const notification = Notification.reconstitute({
      id: Notification.create(userId, NotificationType.TransferSent, 't', 'm').id,
      userId,
      type: NotificationType.TransferSent,
      title: 't',
      message: 'm',
      isRead: true,
      createdAt: new Date(),
    });

    expect(notification.pullDomainEvents()).toHaveLength(0);
    expect(notification.isRead).toBe(true);
  });
});
