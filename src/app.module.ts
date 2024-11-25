import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  WinstonModule,
  utilities as nestWinstonModuleUtilities,
} from 'nest-winston';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { PrismaModule } from 'nestjs-prisma';
import { RedisModule } from '@nestjs-modules/ioredis';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { PermissionsModule } from './permissions/permissions.module';
import { RolesModule } from './roles/roles.module';
import { PermissionGuard } from './common/guard/permission.guard';
import { UploadModule } from './upload/upload.module';
import getSystemConfig from './common/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath:
        process.env.NODE_ENV === 'production'
          ? '../.env.production.local'
          : `../.env.${process.env.NODE_ENV || 'development'}`,
      isGlobal: true,
      cache: true,
    }),
    WinstonModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const config = getSystemConfig(configService);
        const datePattern = config.LOG_DATE_PATTERN;
        const maxSize = config.LOG_MAX_SIZE;
        const maxFiles = config.LOG_MAX_FILES;

        return {
          levels: winston.config.syslog.levels,
          level: config.LOG_LEVEL,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.ms(),
            nestWinstonModuleUtilities.format.nestLike('MyApp', {
              prettyPrint: true,
              colors: true,
            }),
            winston.format.errors({ stack: true }),
          ),
          transports: [
            new winston.transports.Console({
              format: winston.format.combine(
                winston.format.timestamp(),
                nestWinstonModuleUtilities.format.nestLike(),
              ),
            }),
            new DailyRotateFile({
              dirname: path.join(config.LOG_DIR, config.LOG_LEVEL),
              filename: 'application-%DATE%.log',
              datePattern,
              zippedArchive: true,
              maxSize,
              maxFiles,
              level: config.LOG_LEVEL,
            }),
            new DailyRotateFile({
              dirname: path.join(config.LOG_DIR, 'error'),
              filename: 'error-%DATE%.log',
              datePattern,
              zippedArchive: true,
              maxSize,
              maxFiles,
              level: 'error',
            }),
          ],
          exceptionHandlers: [
            new DailyRotateFile({
              dirname: path.join(config.LOG_DIR, 'exceptions'),
              filename: 'exceptions-%DATE%.log',
              datePattern,
              zippedArchive: true,
              maxSize,
              maxFiles,
            }),
          ],
        };
      },
      inject: [ConfigService],
    }),
    PrismaModule.forRootAsync({
      isGlobal: true,
      useFactory: (configService: ConfigService) => {
        return {
          prismaOptions: {
            datasources: {
              db: {
                url: getSystemConfig(configService).DATABASE_URL,
              },
            },
          },
          explicitConnect: false,
        };
      },
      inject: [ConfigService],
    }),
    RedisModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: 'single',
        url: getSystemConfig(configService).REDIS_URL,
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: getSystemConfig(config).THROTTLE_TTL,
          limit: getSystemConfig(config).THROTTLE_LIMIT,
        },
      ],
    }),
    AuthModule,
    UsersModule,
    PermissionsModule,
    RolesModule,
    UploadModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
  ],
})
export class AppModule {}
