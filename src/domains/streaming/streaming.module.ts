import { Module } from '@nestjs/common';
import { StreamingController } from './presentation/streaming.controller';

@Module({
  controllers: [StreamingController],
})
export class StreamingModule {}
