import { Injectable, BadRequestException } from '@nestjs/common';
import { MinioConfig } from '../config/minio.config';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

@Injectable()
export class FileUploadService {
  constructor(private readonly minioConfig: MinioConfig) {}

  async uploadProfilePhoto(
    file: Express.Multer.File,
    userId: string,
  ): Promise<{ url: string; filename: string }> {
    try {
      // Validar tipo de arquivo
      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException(
          'Tipo de arquivo não suportado. Use JPEG, PNG ou WebP.',
        );
      }

      // Validar tamanho do arquivo (5MB máximo)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new BadRequestException(
          'Arquivo muito grande. Tamanho máximo: 5MB.',
        );
      }

      // Gerar nome único para o arquivo
      const fileExtension = path.extname(file.originalname);
      const filename = `profile-photos/${userId}-${uuidv4()}${fileExtension}`;

      // Upload para MinIO
      const minioClient = this.minioConfig.getClient();
      const bucketName = this.minioConfig.getBucketName();

      await minioClient.putObject(
        bucketName,
        filename,
        file.buffer,
        file.size,
        {
          'Content-Type': file.mimetype,
          'Cache-Control': 'max-age=31536000', // 1 ano
        },
      );

      // Gerar URL pública
      const publicUrl = this.minioConfig.getPublicUrl(filename);

      return {
        url: publicUrl,
        filename,
      };
    } catch (error) {
      console.error('Error uploading file to MinIO:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Erro ao fazer upload da imagem.');
    }
  }

  async deleteProfilePhoto(filename: string): Promise<void> {
    try {
      const minioClient = this.minioConfig.getClient();
      const bucketName = this.minioConfig.getBucketName();

      await minioClient.removeObject(bucketName, filename);
    } catch (error) {
      console.error('Error deleting file from MinIO:', error);
      // Não lançar erro para não quebrar o fluxo se a imagem não existir
    }
  }

  async getProfilePhotoUrl(filename: string): Promise<string | null> {
    try {
      const minioClient = this.minioConfig.getClient();
      const bucketName = this.minioConfig.getBucketName();

      // Verificar se o objeto existe
      await minioClient.statObject(bucketName, filename);

      // Retornar URL pública
      return this.minioConfig.getPublicUrl(filename);
    } catch (error) {
      console.error('Error getting file URL from MinIO:', error);
      return null;
    }
  }

  async generatePresignedUrl(filename: string, expiry = 7 * 24 * 60 * 60): Promise<string> {
    try {
      const minioClient = this.minioConfig.getClient();
      const bucketName = this.minioConfig.getBucketName();

      // Gerar URL pré-assinada para acesso temporário
      const presignedUrl = await minioClient.presignedGetObject(
        bucketName,
        filename,
        expiry,
      );

      return presignedUrl;
    } catch (error) {
      console.error('Error generating presigned URL:', error);
      throw new BadRequestException('Erro ao gerar URL de acesso à imagem.');
    }
  }

  validateImageFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo foi enviado.');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Tipo de arquivo não suportado. Use JPEG, PNG ou WebP.',
      );
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException(
        'Arquivo muito grande. Tamanho máximo: 5MB.',
      );
    }
  }
}

