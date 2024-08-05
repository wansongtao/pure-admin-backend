import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
      isGlobal: true,
      cache: true,
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
    AuthModule,
    UsersModule,
    PermissionsModule,
    RolesModule,
    UploadModule,
  ],
  providers: [
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
