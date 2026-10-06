import { NotificationEmitter, NOTIFICATION_EVENT } from './notification-emitter';
import { Notification, NotificationType } from '../../domain/entity/notification.entity';
import { UserId } from '../../../identity/domain/value-object/user-id.vo';
import type { NotificationRepositoryPort } from '../ports/notification.port';
import type { NotificationGateway } from '../../infrastructure/gateway/notification.gateway';

describe('NotificationEmitter', () => {
  const userId = UserId.fromString('11111111-1111-1111-1111-111111111111');

  let repo: { create: jest.Mock };
  let gateway: { notifyUser: jest.Mock };
  let emitter: NotificationEmitter;

  beforeEach(() => {
    repo = { create: jest.fn().mockResolvedValue(undefined) };
    gateway = { notifyUser: jest.fn() };

    emitter = new NotificationEmitter(
      repo as unknown as NotificationRepositoryPort,
      gateway as unknown as NotificationGateway,
    );
  });

  it('persists the notification before pushing it', async () => {
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

  it('pushes the full payload over the websocket', async () => {
    const notification = await emitter.emit(
      userId,
      NotificationType.TransferReceived,
      'Money received',
      '₹100 received from 11111111111111111111',
    );

    expect(gateway.notifyUser).toHaveBeenCalledWith(
      userId.getValue(),
      NOTIFICATION_EVENT,
      {
        id: notification.id.getValue(),
        type: NotificationType.TransferReceived,
        title: 'Money received',
        message: '₹100 received from 11111111111111111111',
        isRead: false,
        createdAt: notification.createdAt.toISOString(),
      },
    );
  });

  it('does not push anything when persistence fails', async () => {
    repo.create.mockRejectedValue(new Error('db down'));

    await expect(
      emitter.emit(userId, NotificationType.TransferSent, 't', 'm'),
    ).rejects.toThrow('db down');

    expect(gateway.notifyUser).not.toHaveBeenCalled();
  });
});
