import { BadRequestException, Injectable } from '@nestjs/common';
import { LocalStorageService } from '../infrastructure/storage/local-storage.service';
import { UploadedFile } from '../infrastructure/interfaces/storage.interface';

@Injectable()
export class UploadService {
  constructor(private localStorageService: LocalStorageService) {}

  async uploadFile(file: Express.Multer.File): Promise<UploadedFile> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    return this.localStorageService.upload(file);
  }

  async uploadFiles(files: Express.Multer.File[]): Promise<UploadedFile[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    return Promise.all(
      files.map((file) => this.localStorageService.upload(file)),
    );
  }

  async deleteFile(fileName: string): Promise<void> {
    const exists = await this.localStorageService.exists(fileName);

    if (!exists) {
      throw new BadRequestException('File not found');
    }

    return this.localStorageService.delete(fileName);
  }

  getFileUrl(fileName: string): string {
    return this.localStorageService.getFileUrl(fileName);
  }
}
