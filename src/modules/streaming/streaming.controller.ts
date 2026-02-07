import {
  Controller,
  Get,
  Param,
  Res,
  NotFoundException,
  BadRequestException,
  Sse,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { Public } from '../../common/decorators/public.decorator';
import * as fs from 'fs';
import * as path from 'path';
import { Observable, interval, map } from 'rxjs';

interface MessageEvent {
  data: string | object;
  id?: string;
  type?: string;
  retry?: number;
}

@ApiTags('Streaming')
@ApiBearerAuth()
@Controller({ path: 'streaming', version: '1' })
export class StreamingController {
  constructor(private configService: ConfigService) {}

  @Get('file/:fileName')
  @ApiOperation({ summary: 'Stream a file download' })
  async streamFile(@Param('fileName') fileName: string, @Res() res: Response) {
    const uploadDir = this.configService.get<string>('UPLOAD_DEST', './uploads');
    const filePath = path.join(uploadDir, fileName);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    // Get file stats
    const stats = fs.statSync(filePath);
    const fileSize = stats.size;

    // Set headers for streaming
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', fileSize);

    // Create read stream and pipe to response
    const fileStream = fs.createReadStream(filePath);

    fileStream.on('error', (error) => {
      throw new BadRequestException(`Error streaming file: ${error.message}`);
    });

    fileStream.pipe(res);
  }

  @Get('video/:fileName')
  @ApiOperation({ summary: 'Stream a video with range support' })
  async streamVideo(@Param('fileName') fileName: string, @Res() res: Response) {
    const uploadDir = this.configService.get<string>('UPLOAD_DEST', './uploads');
    const filePath = path.join(uploadDir, fileName);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    const stats = fs.statSync(filePath);
    const fileSize = stats.size;
    const range = res.req.headers.range;

    if (range) {
      // Parse range header
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      // Set headers for partial content
      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Length', chunkSize);
      res.setHeader('Content-Type', 'video/mp4');

      // Create read stream for the specified range
      const stream = fs.createReadStream(filePath, { start, end });
      stream.pipe(res);
    } else {
      // No range header, send entire file
      res.setHeader('Content-Length', fileSize);
      res.setHeader('Content-Type', 'video/mp4');

      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
    }
  }

  @Sse('events')
  @Public()
  @ApiOperation({ summary: 'Server-Sent Events endpoint for real-time updates' })
  sendEvents(): Observable<MessageEvent> {
    // Send a message every second with current timestamp
    return interval(1000).pipe(
      map((index) => ({
        data: {
          message: 'Server time update',
          timestamp: new Date().toISOString(),
          index,
        },
        id: `${Date.now()}`,
        type: 'time-update',
      })),
    );
  }

  @Sse('progress/:taskId')
  @ApiOperation({ summary: 'Track progress of a long-running task' })
  trackProgress(@Param('taskId') taskId: string): Observable<MessageEvent> {
    // Simulate progress updates for a task
    let progress = 0;

    return interval(500).pipe(
      map(() => {
        progress += 10;
        const isComplete = progress >= 100;

        return {
          data: {
            taskId,
            progress: Math.min(progress, 100),
            status: isComplete ? 'completed' : 'in_progress',
            message: isComplete
              ? 'Task completed successfully'
              : `Processing... ${progress}%`,
          },
          id: `${Date.now()}`,
          type: isComplete ? 'complete' : 'progress',
        };
      }),
    );
  }
}
