import { ConfigService } from '@nestjs/config';
import type { JwtSignOptions } from '@nestjs/jwt';

interface ISystemConfig {
  readonly PREFIX: string;
  readonly PORT: number;
  readonly DEFAULT_USERNAME: string;
  readonly DEFAULT_PASSWORD: string;
  readonly DEFAULT_SUPER_PERMISSION: string;
  readonly SWAGGER_TITLE: string;
  readonly SWAGGER_DESCRIPTION: string;
  readonly SWAGGER_VERSION: string;
  readonly DATABASE_URL: string;
  readonly REDIS_URL: string;
  readonly JWT_ALGORITHM: JwtSignOptions['algorithm'];
  readonly JWT_PUBLIC_KEY: string;
  readonly JWT_PRIVATE_KEY: string;
  readonly JWT_EXPIRES_IN: number;
  readonly CAPTCHA_EXPIRES_IN: number;
  readonly BCRYPT_SALT_ROUNDS: number;
  readonly MINIO_ENDPOINT: string;
  readonly MINIO_PORT: number;
  readonly MINIO_USE_SSL: boolean;
  readonly MINIO_ACCESS_KEY: string;
  readonly MINIO_SECRET_KEY: string;
  readonly MINIO_BUCKET_NAME: string;
  readonly MINIO_EXPIRES_IN: number;
  readonly THROTTLE_TTL: number;
  readonly THROTTLE_LIMIT: number;
  readonly LOG_LEVEL: string;
  readonly LOG_DIR: string;
  readonly LOG_MAX_SIZE: string;
  readonly LOG_MAX_FILES: string;
  readonly LOG_DATE_PATTERN: string;
}

let config: ISystemConfig | null = null;
const getSystemConfig = (configService: ConfigService) => {
  if (config !== null) {
    return config;
  }

  config = {
    PREFIX: configService.get<string>('PREFIX') || '/api/v1',
    PORT: +configService.get<number>('PORT') || 3001,
    DEFAULT_USERNAME: configService.get<string>('DEFAULT_USERNAME') || 'admin',
    DEFAULT_PASSWORD:
      configService.get<string>('DEFAULT_PASSWORD') || 'd.123456',
    DEFAULT_SUPER_PERMISSION:
      configService.get<string>('DEFAULT_SUPER_PERMISSION') || '*:*:*',
    SWAGGER_TITLE: configService.get<string>('SWAGGER_TITLE') || 'NestJS',
    SWAGGER_DESCRIPTION: configService.get<string>('SWAGGER_DESCRIPTION') || '',
    SWAGGER_VERSION: configService.get<string>('SWAGGER_VERSION') || '1.0',
    DATABASE_URL: configService.get<string>('DATABASE_URL') || '',
    REDIS_URL: configService.get<string>('REDIS_URL') || '',
    JWT_ALGORITHM: (configService.get<string>('JWT_ALGORITHM') ||
      'RS256') as JwtSignOptions['algorithm'],
    JWT_PUBLIC_KEY: configService.get<string>('JWT_PUBLIC_KEY') || '',
    JWT_PRIVATE_KEY: configService.get<string>('JWT_PRIVATE_KEY') || '',
    JWT_EXPIRES_IN: +configService.get<number>('JWT_EXPIRES_IN') || 86400,
    CAPTCHA_EXPIRES_IN: +configService.get<number>('CAPTCHA_EXPIRES_IN') || 120,
    BCRYPT_SALT_ROUNDS: +configService.get<number>('BCRYPT_SALT_ROUNDS') || 10,
    MINIO_ENDPOINT: configService.get<string>('MINIO_ENDPOINT') || '',
    MINIO_PORT: +configService.get<number>('MINIO_PORT') || 9000,
    MINIO_USE_SSL: configService.get('MINIO_USE_SSL') === 'true',
    MINIO_ACCESS_KEY: configService.get<string>('MINIO_ACCESS_KEY') || '',
    MINIO_SECRET_KEY: configService.get<string>('MINIO_SECRET_KEY') || '',
    MINIO_BUCKET_NAME: configService.get<string>('MINIO_BUCKET_NAME') || '',
    MINIO_EXPIRES_IN: +configService.get<number>('MINIO_EXPIRES_IN') || 120,
    THROTTLE_TTL: +configService.get<number>('THROTTLE_TTL') || 10000,
    THROTTLE_LIMIT: +configService.get<number>('THROTTLE_LIMIT') || 20,
    LOG_LEVEL: configService.get<string>('LOG_LEVEL') || 'info',
    LOG_DIR: configService.get<string>('LOG_DIR') || 'logs',
    LOG_MAX_SIZE: configService.get<string>('LOG_MAX_SIZE') || '20m',
    LOG_MAX_FILES: configService.get<string>('LOG_MAX_FILES') || '14d',
    LOG_DATE_PATTERN:
      configService.get<string>('LOG_DATE_PATTERN') || 'YYYY-MM-DD',
  };

  return config;
};

export default getSystemConfig;
