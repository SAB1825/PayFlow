import { NotificationGateway } from './notification.gateway';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Socket, Server } from 'socket.io';

describe('NotificationGateway', () => {
  const userId = '11111111-1111-1111-1111-111111111111';

  let jwtService: { verifyAsync: jest.Mock };
  let configService: { getOrThrow: jest.Mock };
  let gateway: NotificationGateway;

  beforeEach(() => {
    jwtService = { verifyAsync: jest.fn() };
    configService = { getOrThrow: jest.fn().mockReturnValue('secret') };

    gateway = new NotificationGateway(
      jwtService as unknown as JwtService,
      configService as unknown as ConfigService,
    );
  });

  function makeSocket(handshake: Record<string, unknown>): Socket {
    return {
      handshake,
      data: {},
      join: jest.fn(),
      disconnect: jest.fn(),
      emit: jest.fn(),
    } as unknown as Socket;
  }

  it('joins the socket to the room named after the user id', async () => {
    jwtService.verifyAsync.mockResolvedValue({ sub: userId });
    const client = makeSocket({ auth: { token: 'valid-token' }, query: {} });

    await gateway.handleConnection(client);

    expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-token', {
      secret: 'secret',
      algorithms: ['HS256'],
    });
    expect(client.join).toHaveBeenCalledWith(userId);
    expect(client.disconnect).not.toHaveBeenCalled();
  });

  it('drops the connection when no token is supplied', async () => {
    const client = makeSocket({ auth: {}, query: {} });

    await gateway.handleConnection(client);

    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
    expect(client.disconnect).toHaveBeenCalledWith(true);
  });

  it('drops the connection when the token is invalid', async () => {
    jwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'));
    const client = makeSocket({ auth: { token: 'expired' }, query: {} });

    await gateway.handleConnection(client);

    expect(client.emit).toHaveBeenCalledWith('unauthorized', expect.any(Object));
    expect(client.join).not.toHaveBeenCalled();
    expect(client.disconnect).toHaveBeenCalledWith(true);
  });

  it('drops the connection when the token has no subject', async () => {
    jwtService.verifyAsync.mockResolvedValue({ email: 'a@b.c' });
    const client = makeSocket({ auth: { token: 'no-sub' }, query: {} });

    await gateway.handleConnection(client);

    expect(client.join).not.toHaveBeenCalled();
    expect(client.disconnect).toHaveBeenCalledWith(true);
  });

  it('accepts the token from the query string as well', async () => {
    jwtService.verifyAsync.mockResolvedValue({ sub: userId });
    const client = makeSocket({ auth: {}, query: { token: 'query-token' } });

    await gateway.handleConnection(client);

    expect(client.join).toHaveBeenCalledWith(userId);
  });

  describe('notifyUser', () => {
    it('is a no-op before the server is attached', () => {
      expect(() =>
        gateway.notifyUser(userId, 'notification', { title: 'hi' }),
      ).not.toThrow();
    });

    it('emits to the user room only', () => {
      const emit = jest.fn();
      const to = jest.fn().mockReturnValue({ emit });
      gateway.server = { to } as unknown as Server;

      gateway.notifyUser(userId, 'notification', { title: 'hi' });

      expect(to).toHaveBeenCalledWith(userId);
      expect(emit).toHaveBeenCalledWith('notification', { title: 'hi' });
    });
  });
});
