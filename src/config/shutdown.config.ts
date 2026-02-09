import { registerAs } from '@nestjs/config';

export default registerAs('shutdown', () => ({
  shutdownTimeout: parseInt(process.env.SHUTDOWN_TIMEOUT || '30000', 10),
  queueDrainTimeout: parseInt(process.env.QUEUE_DRAIN_TIMEOUT || '20000', 10),
  websocketCloseTimeout: parseInt(
    process.env.WEBSOCKET_CLOSE_TIMEOUT || '5000',
    10,
  ),
}));
