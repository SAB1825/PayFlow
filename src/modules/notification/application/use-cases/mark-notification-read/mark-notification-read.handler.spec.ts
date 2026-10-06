import { MarkNotificationReadHandler } from './mark-notification-read.handler';
import { MarkNotificationReadCommand } from './mark-notification-read.command';
import { Notification, NotificationType } from '../../../domain/entity/notification.entity';
import { NotificationId } from '../../../domain/value-object/notification-id.vo';
import { NotificationReadEvent } from '../../../domain/events/notification-read.event';
import { UserId } from '../../../../identity/domain/value-object/user-id.vo';
import { ApplicationExceptionCode } from '../../../../../shared/domain/exception/application.exception';
import type { NotificationRepositoryPort } from '../../ports/notification.port';

describe('MarkNotificationReadHandler', () => {
  const userId = '11111111-1111-1111-1111-111111111111';

  let repo: { findByIdForUser: jest.Mock; markRead: jest.Mock };
  let eventBus: { publish: jest.Mock };
  let handler: MarkNotificationReadHandler;

  beforeEach(() => {
    repo = {
      findByIdForUser: jest.fn(),
      markRead: jest.fn().mockResolvedValue(undefined),
    };
    eventBus = { publish: jest.fn() };

    handler = new MarkNotificationReadHandler(
      repo as unknown as NotificationRepositoryPort,
      eventBus as any,
    );
  });

  function makeNotification(isRead: boolean): Notification {
    const notification = Notification.create(
      UserId.fromString(userId),
      NotificationType.TransferSent,
      'Transfer sent',
      '₹100 sent',
    );
    if (isRead) notification.markRead();
    return notification;
  }

  it('marks an unread notification as read', async () => {
    const notification = makeNotification(false);
    repo.findByIdForUser.mockResolvedValue(notification);

    await handler.execute(
      new MarkNotificationReadCommand(notification.id.getValue(), userId),
    );

    expect(notification.isRead).toBe(true);
    expect(repo.markRead).toHaveBeenCalledWith(notification.id);
  });

  it('publishes NotificationReadEvent only after the update lands', async () => {
    const order: string[] = [];
    repo.markRead.mockImplementation(async () => order.push('persisted'));
    eventBus.publish.mockImplementation(() => order.push('published'));

    const notification = makeNotification(false);
    repo.findByIdForUser.mockResolvedValue(notification);

    await handler.execute(
      new MarkNotificationReadCommand(notification.id.getValue(), userId),
    );

    expect(order).toEqual(['persisted', 'published']);
    expect(eventBus.publish).toHaveBeenCalledTimes(1);

    const published = eventBus.publish.mock.calls[0][0];
    expect(published).toBeInstanceOf(NotificationReadEvent);
    expect(published.notification.id.equals(notification.id)).toBe(true);
    expect(published.notification.isRead).toBe(true);
  });

  it('is idempotent for an already read notification', async () => {
    const notification = makeNotification(true);
    repo.findByIdForUser.mockResolvedValue(notification);

    await handler.execute(
      new MarkNotificationReadCommand(notification.id.getValue(), userId),
    );

    expect(repo.markRead).not.toHaveBeenCalled();
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it("rejects a notification that doesn't exist or belongs to someone else", async () => {
    repo.findByIdForUser.mockResolvedValue(null);

    await expect(
      handler.execute(
        new MarkNotificationReadCommand(NotificationId.create().getValue(), userId),
      ),
    ).rejects.toMatchObject({
      code: ApplicationExceptionCode.NOT_FOUND,
    });

    expect(repo.markRead).not.toHaveBeenCalled();
    expect(eventBus.publish).not.toHaveBeenCalled();

    const [idArg, userArg] = repo.findByIdForUser.mock.calls[0];
    expect(idArg).toBeInstanceOf(NotificationId);
    expect(userArg).toBeInstanceOf(UserId);
    expect(userArg.getValue()).toBe(userId);
  });
});
