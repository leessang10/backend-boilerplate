import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { UploadController } from './presentation/upload.controller';
import { UploadService } from './application/upload.service';
import { LocalStorageService } from './infrastructure/storage/local-storage.service';
import { S3StorageService } from './infrastructure/storage/s3-storage.service';

@Module({
  imports: [
    MulterModule.register({
      dest: process.env.UPLOAD_DEST || './uploads',
    }),
  ],
  controllers: [UploadController],
  providers: [UploadService, LocalStorageService, S3StorageService],
  exports: [UploadService],
})
export class UploadModule {}
