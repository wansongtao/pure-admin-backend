import { ExtractJwt, Strategy, StrategyOptionsWithRequest } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { Request } from 'express';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    @InjectRedis() private readonly redis: Redis,
  ) {
    const secret = configService.get('JWT_SECRET');

    const options: StrategyOptionsWithRequest = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      passReqToCallback: true,
    };

    super(options);
  }

  async validate(req: Request, payload: { userId: string; userName: string }) {
    const token = req.headers.authorization.split(' ')[1];
    const validToken = await this.redis.get(`login:${payload.userId}`);
    if (validToken !== token) {
      throw new UnauthorizedException('Invalid token');
    }

    const user = await this.usersService.validateUser(payload.userName);
    if (!user) {
      throw new UnauthorizedException('No user found');
    }

    return { userId: payload.userId, userName: payload.userName };
  }
}
