import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';

@Injectable()
export class UploadService {
  private minioClient: Client;
  private readonly bucketName: string = '';

  constructor(private readonly configService: ConfigService) {
    this.minioClient = new Client({
      endPoint: this.configService.get('MINIO_ENDPOINT') || 'localhost',
      port: +this.configService.get('MINIO_PORT') || 9000,
      useSSL: this.configService.get('MINIO_USE_SSL') === 'true',
      accessKey: this.configService.get('MINIO_ACCESS_KEY') || '',
      secretKey: this.configService.get('MINIO_SECRET_KEY') || '',
    });

    this.bucketName = this.configService.get('MINIO_BUCKET_NAME') || 'avatar';
  }

  async presignedUrl(fileName: string) {
    const expires = +this.configService.get('MINIO_EXPIRES_IN') || 60;
    return this.minioClient.presignedPutObject(
      this.bucketName,
      fileName,
      expires,
    );
  }
}
