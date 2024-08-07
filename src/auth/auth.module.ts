import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, type JwtModuleOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { UsersModule } from '../users/users.module';
import { readFileSync } from 'fs';
import { join } from 'path';
import { RolesModule } from '../roles/roles.module';
import { PermissionsModule } from '../permissions/permissions.module';
import getSystemConfig from '../common/config';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => {
        const systemConfig = getSystemConfig(configService);

        const staticPath = join(__dirname, '../../');
        const privateKey = readFileSync(
          join(staticPath, systemConfig.JWT_PRIVATE_KEY),
        );
        const publicKey = readFileSync(
          join(staticPath, systemConfig.JWT_PUBLIC_KEY),
        );

        const options: JwtModuleOptions = {
          signOptions: {
            expiresIn: systemConfig.JWT_EXPIRES_IN,
          },
          privateKey,
          publicKey,
        };

        return options;
      },
      inject: [ConfigService],
    }),
    UsersModule,
    RolesModule,
    PermissionsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
