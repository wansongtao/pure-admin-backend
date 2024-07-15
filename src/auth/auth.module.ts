import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { UsersModule } from '../users/users.module';
import { readFileSync } from 'fs';
import { join } from 'path';
import { RolesModule } from '../roles/roles.module';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => {
        const staticPath = join(__dirname, '../../');
        const privateKeyPath = configService.get<string>('JWT_PRIVATE_KEY');
        const publicKeyPath = configService.get<string>('JWT_PUBLIC_KEY');
        const privateKey = readFileSync(join(staticPath, privateKeyPath));
        const publicKey = readFileSync(join(staticPath, publicKeyPath));

        const options = {
          signOptions: {
            expiresIn: +configService.get<string>('JWT_EXPIRES_IN'),
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
