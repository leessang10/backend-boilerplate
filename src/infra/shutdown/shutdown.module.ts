import { Global, Module } from '@nestjs/common';
import { ShutdownService } from './shutdown.service';

/**
 * Global module for graceful shutdown coordination
 * Registers signal handlers and orchestrates shutdown sequence
 */
@Global()
@Module({
  providers: [ShutdownService],
  exports: [ShutdownService],
})
export class ShutdownModule {}
