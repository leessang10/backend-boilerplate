import {
  Controller,
  Post,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  Get,
  Res,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { UploadService } from '../application/upload.service';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';

@ApiTags('Upload')
@ApiBearerAuth()
@Controller({ path: 'upload', version: '1' })
export class UploadController {
  constructor(
    private uploadService: UploadService,
    private configService: ConfigService,
  ) {}

  @Post('single')
  @ApiOperation({ summary: 'Upload a single file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: parseInt(process.env.UPLOAD_MAX_FILE_SIZE || '10485760', 10), // 10MB default
      },
      fileFilter: (req, file, callback) => {
        // Example: Only allow images
        // Customize based on your requirements
        const allowedMimes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'application/pdf',
          'text/plain',
        ];

        if (allowedMimes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(
            new BadRequestException(
              `File type not allowed. Allowed types: ${allowedMimes.join(', ')}`,
            ),
            false,
          );
        }
      },
    }),
  )
  async uploadSingle(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.uploadFile(file);
  }

  @Post('multiple')
  @ApiOperation({ summary: 'Upload multiple files (max 10)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      limits: {
        fileSize: parseInt(process.env.UPLOAD_MAX_FILE_SIZE || '10485760', 10),
      },
    }),
  )
  async uploadMultiple(@UploadedFiles() files: Express.Multer.File[]) {
    return this.uploadService.uploadFiles(files);
  }

  @Delete(':fileName')
  @ApiOperation({ summary: 'Delete a file' })
  @Roles(Role.ADMIN)
  async deleteFile(@Param('fileName') fileName: string) {
    await this.uploadService.deleteFile(fileName);
    return { message: 'File deleted successfully' };
  }

  @Get(':fileName')
  @ApiOperation({ summary: 'Download/view a file' })
  downloadFile(@Param('fileName') fileName: string, @Res() res: Response) {
    const uploadDir = this.configService.get<string>(
      'UPLOAD_DEST',
      './uploads',
    );
    const filePath = path.join(uploadDir, fileName);

    if (!fs.existsSync(filePath)) {
      throw new BadRequestException('File not found');
    }

    res.sendFile(filePath, { root: '.' });
  }
}
