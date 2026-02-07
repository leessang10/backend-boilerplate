import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IStorageService, UploadedFile } from '../interfaces/storage.interface';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

/**
 * S3 Storage Service (stub for future implementation)
 *
 * To implement:
 * 1. Install AWS SDK: pnpm add @aws-sdk/client-s3
 * 2. Add S3 config to environment variables
 * 3. Implement upload/delete/exists methods using S3Client
 */
@Injectable()
export class S3StorageService implements IStorageService {
  private readonly logger = new Logger(S3StorageService.name);

  constructor(private configService: ConfigService) {
    this.logger.warn('S3StorageService is a stub. Implement S3 integration for production use.');
  }

  async upload(file: Express.Multer.File): Promise<UploadedFile> {
    const ext = path.extname(file.originalname);
    const fileName = `${uuidv4()}${ext}`;

    // TODO: Implement S3 upload
    // const s3Client = new S3Client({ region: this.configService.get('AWS_REGION') });
    // const command = new PutObjectCommand({
    //   Bucket: this.configService.get('S3_BUCKET'),
    //   Key: fileName,
    //   Body: file.buffer,
    //   ContentType: file.mimetype,
    // });
    // await s3Client.send(command);

    throw new Error('S3 upload not implemented');
  }

  async delete(fileName: string): Promise<void> {
    // TODO: Implement S3 delete
    throw new Error('S3 delete not implemented');
  }

  getFileUrl(fileName: string): string {
    // TODO: Return S3 URL or CloudFront URL
    return `https://your-bucket.s3.amazonaws.com/${fileName}`;
  }

  async exists(fileName: string): Promise<boolean> {
    // TODO: Implement S3 exists check
    return false;
  }
}
