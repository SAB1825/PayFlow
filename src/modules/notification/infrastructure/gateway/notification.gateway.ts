import {
  WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

interface AccessTokenPayload {
  sub?: unknown;
  email?: unknown;
}

@WebSocketGateway({ cors: { origin: '*' } })
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) { }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token ?? client.handshake.query?.token;
      if (typeof token !== 'string' || token.length === 0) {
        throw new Error('Missing access token');
      }

      const payload = await this.jwtService.verifyAsync<AccessTokenPayload>(token, {
        secret: this.configService.getOrThrow<string>('ACCESS_TOKEN_SECRET'),
        algorithms: ['HS256'],
      });

      if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
        throw new Error('Invalid access token payload');
      }

      client.data.userId = payload.sub;
      client.join(payload.sub);
    } catch {
      client.emit('unauthorized', { message: 'Invalid or missing access token' });
      client.disconnect(true);
    }
  }

  handleDisconnect(_client: Socket) {
  }

  notifyUser(userId: string, event: string, payload: unknown): void {
    if (!this.server) return;
    this.server.to(userId).emit(event, payload);
  }
}
