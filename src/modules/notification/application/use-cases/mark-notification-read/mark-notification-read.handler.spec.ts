import { MarkNotificationReadHandler } from './mark-notification-read.handler';
import { MarkNotificationReadCommand } from './mark-notification-read.command';
import { Notification, NotificationType } from '../../../domain/entity/notification.entity';
import { NotificationId } from '../../../domain/value-object/notification-id.vo';
import { UserId } from '../../../../identity/domain/value-object/user-id.vo';
import { ApplicationExceptionCode } from '../../../../../shared/domain/exception/application.exception';
import type { NotificationRepositoryPort } from '../../ports/notification.port';

describe('MarkNotificationReadHandler', () => {
  const userId = '11111111-1111-1111-1111-111111111111';

  let repo: { findByIdForUser: jest.Mock; markRead: jest.Mock };
  let handler: MarkNotificationReadHandler;

  beforeEach(() => {
    repo = {
      findByIdForUser: jest.fn(),
      markRead: jest.fn().mockResolvedValue(undefined),
    };

    handler = new MarkNotificationReadHandler(
      repo as unknown as NotificationRepositoryPort,
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

  it('is idempotent for an already read notification', async () => {
    const notification = makeNotification(true);
    repo.findByIdForUser.mockResolvedValue(notification);

    await handler.execute(
      new MarkNotificationReadCommand(notification.id.getValue(), userId),
    );

    expect(repo.markRead).not.toHaveBeenCalled();
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

    const [idArg, userArg] = repo.findByIdForUser.mock.calls[0];
    expect(idArg).toBeInstanceOf(NotificationId);
    expect(userArg).toBeInstanceOf(UserId);
    expect(userArg.getValue()).toBe(userId);
  });
});
