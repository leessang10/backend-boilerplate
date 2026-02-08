import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MetricsModule } from '@infra/metrics';
import { WebsocketGateway } from './presentation/websocket.gateway';
import { WsJwtGuard } from './infrastructure/guards/ws-jwt.guard';

@Module({
  imports: [JwtModule, MetricsModule],
  providers: [WebsocketGateway, WsJwtGuard],
  exports: [WebsocketGateway],
})
export class WebsocketModule {}
