import { NotificationEmitter } from './notification-emitter';
import { Notification, NotificationType } from '../../domain/entity/notification.entity';
import { NotificationCreatedEvent } from '../../domain/events/notification-created.event';
import { UserId } from '../../../identity/domain/value-object/user-id.vo';
import type { NotificationRepositoryPort } from '../ports/notification.port';

describe('NotificationEmitter', () => {
  const userId = UserId.fromString('11111111-1111-1111-1111-111111111111');

  let repo: { create: jest.Mock };
  let eventBus: { publish: jest.Mock };
  let emitter: NotificationEmitter;

  beforeEach(() => {
    repo = { create: jest.fn().mockResolvedValue(undefined) };
    eventBus = { publish: jest.fn() };

    emitter = new NotificationEmitter(
      repo as unknown as NotificationRepositoryPort,
      eventBus as any,
    );
  });

  it('persists the notification', async () => {
    const notification = await emitter.emit(
      userId,
      NotificationType.TransferSent,
      'Transfer sent',
      '₹100 sent to 22222222222222222222',
    );

    expect(repo.create).toHaveBeenCalledTimes(1);
    expect(repo.create.mock.calls[0][0]).toBeInstanceOf(Notification);
    expect(notification.isRead).toBe(false);
    expect(notification.userId.equals(userId)).toBe(true);
  });

  it('publishes NotificationCreatedEvent to the CQRS bus after the commit', async () => {
    const order: string[] = [];
    repo.create.mockImplementation(async () => order.push('persisted'));
    eventBus.publish.mockImplementation(() => order.push('published'));

    const notification = await emitter.emit(
      userId,
      NotificationType.TransferReceived,
      'Money received',
      '₹100 received',
    );

    expect(order).toEqual(['persisted', 'published']);
    expect(eventBus.publish).toHaveBeenCalledTimes(1);

    const published = eventBus.publish.mock.calls[0][0];
    expect(published).toBeInstanceOf(NotificationCreatedEvent);
    expect(published.notification).toBe(notification);
    expect(published.notification.id.equals(notification.id)).toBe(true);
  });

  it('drains the aggregate so the same event is not published twice', async () => {
    await emitter.emit(userId, NotificationType.TransferSent, 't', 'm');
    await emitter.emit(userId, NotificationType.TransferSent, 't', 'm');

    expect(eventBus.publish).toHaveBeenCalledTimes(2);
    const [first, second] = eventBus.publish.mock.calls.map(([event]) => event);
    expect(first.notification.id.getValue()).not.toBe(second.notification.id.getValue());
  });

  it('publishes nothing when persistence fails', async () => {
    repo.create.mockRejectedValue(new Error('db down'));

    await expect(
      emitter.emit(userId, NotificationType.TransferSent, 't', 'm'),
    ).rejects.toThrow('db down');

    expect(eventBus.publish).not.toHaveBeenCalled();
  });
});
