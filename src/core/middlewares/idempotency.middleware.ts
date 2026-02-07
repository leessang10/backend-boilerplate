import { Injectable, NestMiddleware, Logger, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { Reflector } from '@nestjs/core';

export const IDEMPOTENT = 'idempotent';

@Injectable()
export class IdempotencyMiddleware implements NestMiddleware {
  private readonly logger = new Logger(IdempotencyMiddleware.name);
  private readonly ttl = 24 * 60 * 60 * 1000; // 24 hours

  constructor(private prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Only handle POST, PUT, PATCH methods
    const shouldCheck = ['POST', 'PUT', 'PATCH'].includes(req.method);

    if (!shouldCheck) {
      return next();
    }

    // Get idempotency key from header
    const idempotencyKey = req.headers['idempotency-key'] as string;

    if (!idempotencyKey) {
      // No idempotency key provided, proceed normally
      return next();
    }

    try {
      // Check if this key was already processed
      const existingKey = await this.prisma.idempotencyKey.findUnique({
        where: { key: idempotencyKey },
      });

      if (existingKey) {
        // Check if key has expired
        if (existingKey.expiresAt < new Date()) {
          // Key expired, delete it and proceed
          await this.prisma.idempotencyKey.delete({
            where: { key: idempotencyKey },
          });

          this.logger.debug(`Expired idempotency key deleted: ${idempotencyKey}`);
        } else {
          // Key is still valid, return cached response
          this.logger.log(`Duplicate request detected: ${idempotencyKey}`);

          return res
            .status(existingKey.statusCode || HttpStatus.OK)
            .json(existingKey.response as any);
        }
      }

      // Store original send function
      const originalSend = res.send.bind(res);
      let responseBody: any;
      let statusCode: number;

      // Override send function to capture response
      res.send = function (body: any): Response {
        responseBody = body;
        statusCode = res.statusCode;
        return originalSend(body);
      } as any;

      // Wait for response to complete
      res.on('finish', async () => {
        try {
          // Only store successful responses (2xx status codes)
          if (statusCode >= 200 && statusCode < 300) {
            const expiresAt = new Date(Date.now() + this.ttl);

            // Parse response if it's a string
            let parsedResponse = responseBody;
            if (typeof responseBody === 'string') {
              try {
                parsedResponse = JSON.parse(responseBody);
              } catch {
                // Keep as string if not valid JSON
              }
            }

            await this.prisma.idempotencyKey.create({
              data: {
                key: idempotencyKey,
                statusCode,
                response: parsedResponse as any,
                expiresAt,
              },
            });

            this.logger.debug(`Idempotency key stored: ${idempotencyKey}`);
          }
        } catch (error) {
          this.logger.error(`Failed to store idempotency key: ${error.message}`);
        }
      });

      next();
    } catch (error) {
      this.logger.error(`Idempotency middleware error: ${error.message}`);
      // Don't block the request on middleware errors
      next();
    }
  }
}
