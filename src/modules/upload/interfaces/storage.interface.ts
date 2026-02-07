export interface UploadedFile {
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  url: string;
  path: string;
}

export interface IStorageService {
  /**
   * Upload a file
   */
  upload(file: Express.Multer.File): Promise<UploadedFile>;

  /**
   * Delete a file
   */
  delete(fileName: string): Promise<void>;

  /**
   * Get file URL
   */
  getFileUrl(fileName: string): string;

  /**
   * Check if file exists
   */
  exists(fileName: string): Promise<boolean>;
}
