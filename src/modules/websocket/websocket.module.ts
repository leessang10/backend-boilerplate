import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { WebsocketGateway } from './websocket.gateway';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { MetricsModule } from '../metrics/metrics.module';

@Module({
  imports: [JwtModule, MetricsModule],
  providers: [WebsocketGateway, WsJwtGuard],
  exports: [WebsocketGateway],
})
export class WebsocketModule {}
