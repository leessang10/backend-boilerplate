import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import type { AuthJwtConfig } from '@domains/auth';
import type { WsJwtPayload, WsUser } from '@infra/websocket';

interface AuthenticatedSocket extends Socket {
  user?: WsUser;
}

@Injectable()
export class WsJwtGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtGuard.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: AuthenticatedSocket = context.switchToWs().getClient();
    const token = this.extractToken(client);

    if (!token) {
      throw new WsException('Unauthorized: No token provided');
    }

    try {
      const jwtConfig = this.configService.get<AuthJwtConfig>('jwt');
      if (!jwtConfig) {
        throw new WsException('Unauthorized: Missing JWT configuration');
      }

      const payload = await this.jwtService.verifyAsync<WsJwtPayload>(token, {
        secret: jwtConfig.access.secret,
      });

      // Attach user to socket
      client.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`WebSocket authentication failed: ${message}`);
      throw new WsException('Unauthorized: Invalid token');
    }
  }

  private extractToken(client: AuthenticatedSocket): string | null {
    // Extract from handshake auth
    const auth = client.handshake?.auth as unknown;
    if (typeof auth === 'object' && auth !== null && 'token' in auth) {
      const authHeader = (auth as { token?: unknown }).token;
      if (typeof authHeader === 'string') {
        return authHeader.replace('Bearer ', '');
      }
    }

    // Extract from handshake headers
    const headerToken = client.handshake?.headers?.authorization;
    if (typeof headerToken === 'string') {
      return headerToken.replace('Bearer ', '');
    }

    // Extract from query params (fallback)
    const queryToken = client.handshake?.query?.token;
    if (typeof queryToken === 'string') {
      return queryToken;
    }

    return null;
  }
}
