import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';
import getSystemConfig from '../common/config';

@Injectable()
export class UploadService {
  private minioClient: Client;

  constructor(private readonly configService: ConfigService) {
    const systemConfig = getSystemConfig(configService);

    this.minioClient = new Client({
      endPoint: systemConfig.MINIO_ENDPOINT,
      port: systemConfig.MINIO_PORT,
      useSSL: systemConfig.MINIO_USE_SSL,
      accessKey: systemConfig.MINIO_ACCESS_KEY,
      secretKey: systemConfig.MINIO_SECRET_KEY,
    });
  }

  async presignedUrl(fileName: string) {
    const systemConfig = getSystemConfig(this.configService);

    return this.minioClient.presignedPutObject(
      systemConfig.MINIO_BUCKET_NAME,
      fileName,
      systemConfig.MINIO_EXPIRES_IN,
    );
  }
}
