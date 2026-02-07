import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../infrastructure/guards/ws-jwt.guard';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import type { Gauge } from 'prom-client';
import type { WsUser } from '../domain/types/ws-user.type';

interface AuthenticatedSocket extends Socket {
  user?: WsUser;
}

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/ws',
})
export class WebsocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebsocketGateway.name);
  private readonly connectedClients = new Map<string, AuthenticatedSocket>();

  constructor(
    @InjectMetric('websocket_connections_total')
    private readonly connectionsGauge: Gauge<string>,
  ) {}

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: AuthenticatedSocket) {
    this.logger.log(`Client connecting: ${client.id}`);
    this.connectionsGauge.inc({ gateway: 'main' });
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);
    this.connectionsGauge.dec({ gateway: 'main' });

    if (client.user) {
      // Notify others in the same room
      this.server.to('lobby').emit('user-left', {
        userId: client.user.id,
        email: client.user.email,
      });
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('authenticate')
  handleAuthenticate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @CurrentUser() user: WsUser | undefined,
  ) {
    if (!user) {
      throw new WsException('Unauthorized: Missing user context');
    }

    this.logger.log(`Client authenticated: ${client.id} - User: ${user.email}`);

    // Store authenticated client
    client.user = user;
    this.connectedClients.set(client.id, client);

    // Join lobby room
    void client.join('lobby');

    // Notify others
    this.server.to('lobby').emit('user-joined', {
      userId: user.id,
      email: user.email,
    });

    return {
      event: 'authenticated',
      data: {
        message: 'Successfully authenticated',
        user: {
          id: user.id,
          email: user.email,
        },
      },
    };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('join-room')
  handleJoinRoom(
    @MessageBody() data: { room: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const { room } = data;

    if (!room) {
      return { event: 'error', data: { message: 'Room name is required' } };
    }

    void client.join(room);
    this.logger.log(`Client ${client.id} joined room: ${room}`);

    // Notify room members
    this.server.to(room).emit('user-joined-room', {
      room,
      userId: client.user?.id,
      email: client.user?.email,
    });

    return {
      event: 'joined-room',
      data: { room, message: `Joined room: ${room}` },
    };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('leave-room')
  handleLeaveRoom(
    @MessageBody() data: { room: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const { room } = data;

    if (!room) {
      return { event: 'error', data: { message: 'Room name is required' } };
    }

    void client.leave(room);
    this.logger.log(`Client ${client.id} left room: ${room}`);

    // Notify room members
    this.server.to(room).emit('user-left-room', {
      room,
      userId: client.user?.id,
      email: client.user?.email,
    });

    return {
      event: 'left-room',
      data: { room, message: `Left room: ${room}` },
    };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('send-message')
  handleMessage(
    @MessageBody() data: { room?: string; message: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const { room, message } = data;

    if (!message) {
      return { event: 'error', data: { message: 'Message is required' } };
    }

    const payload = {
      userId: client.user?.id,
      email: client.user?.email,
      message,
      timestamp: new Date().toISOString(),
    };

    if (room) {
      // Send to specific room
      this.server.to(room).emit('message', { ...payload, room });
      this.logger.log(`Message sent to room ${room} by ${client.user?.email}`);
    } else {
      // Broadcast to all connected clients
      this.server.emit('message', payload);
      this.logger.log(`Broadcast message by ${client.user?.email}`);
    }

    return {
      event: 'message-sent',
      data: { message: 'Message sent successfully' },
    };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: { room?: string; isTyping: boolean },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const { room, isTyping } = data;

    const payload = {
      userId: client.user?.id,
      email: client.user?.email,
      isTyping,
    };

    if (room) {
      // Send to specific room (exclude sender)
      client.to(room).emit('user-typing', { ...payload, room });
    } else {
      // Broadcast to all (exclude sender)
      client.broadcast.emit('user-typing', payload);
    }
  }

  /**
   * Server-side method to broadcast messages
   */
  broadcastToRoom(room: string, event: string, data: unknown) {
    this.server.to(room).emit(event, data);
  }

  /**
   * Server-side method to send to specific user
   */
  sendToUser(userId: string, event: string, data: unknown) {
    // Find client by userId
    const client = Array.from(this.connectedClients.values()).find(
      (c) => c.user?.id === userId,
    );

    if (client) {
      client.emit(event, data);
    }
  }

  /**
   * Get connected users count
   */
  getConnectedUsersCount(): number {
    return this.connectedClients.size;
  }
}
