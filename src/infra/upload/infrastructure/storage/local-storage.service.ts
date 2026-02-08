import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { IStorageService, UploadedFile } from '../interfaces/storage.interface';

@Injectable()
export class LocalStorageService implements IStorageService {
  private readonly logger = new Logger(LocalStorageService.name);
  private readonly uploadDir: string;

  constructor(private configService: ConfigService) {
    this.uploadDir = this.configService.get<string>('UPLOAD_DEST', './uploads');
    void this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
      this.logger.log(`Upload directory ensured: ${this.uploadDir}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to create upload directory: ${message}`);
    }
  }

  async upload(file: Express.Multer.File): Promise<UploadedFile> {
    const ext = path.extname(file.originalname);
    const fileName = `${uuidv4()}${ext}`;
    const filePath = path.join(this.uploadDir, fileName);

    await fs.writeFile(filePath, file.buffer);

    this.logger.log(`File uploaded: ${fileName}`);

    return {
      originalName: file.originalname,
      fileName,
      mimeType: file.mimetype,
      size: file.size,
      url: this.getFileUrl(fileName),
      path: filePath,
    };
  }

  async delete(fileName: string): Promise<void> {
    const filePath = path.join(this.uploadDir, fileName);

    try {
      await fs.unlink(filePath);
      this.logger.log(`File deleted: ${fileName}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to delete file ${fileName}: ${message}`);
      throw error;
    }
  }

  getFileUrl(fileName: string): string {
    // In production, this might be a CDN URL or proper domain
    return `/uploads/${fileName}`;
  }

  async exists(fileName: string): Promise<boolean> {
    const filePath = path.join(this.uploadDir, fileName);

    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
