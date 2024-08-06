import { ExtractJwt, Strategy, StrategyOptionsWithRequest } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { Request } from 'express';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { readFileSync } from 'fs';
import { join } from 'path';
import { getSSOKey } from '../common/config/redis.key';
import getSystemConfig from '../common/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    @InjectRedis() private readonly redis: Redis,
  ) {
    const staticPath = join(__dirname, '../../');
    const publicKeyPath = getSystemConfig(configService).JWT_PUBLIC_KEY;
    const publicKey = readFileSync(join(staticPath, publicKeyPath));

    const options: StrategyOptionsWithRequest = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: publicKey,
      passReqToCallback: true,
    };

    super(options);
  }

  async validate(req: Request, payload: { userId: string; userName: string }) {
    const token = req.headers.authorization.split(' ')[1];
    const ssoKey = getSSOKey(payload.userId);
    const validToken = await this.redis.get(ssoKey);
    if (validToken !== token) {
      throw new UnauthorizedException('Invalid token');
    }

    const user = await this.usersService.findOne(payload.userId);
    if (!user || user?.statusCode > 200 || (user as any).disabled) {
      throw new UnauthorizedException('No user found');
    }

    return { userId: payload.userId, userName: payload.userName };
  }
}
