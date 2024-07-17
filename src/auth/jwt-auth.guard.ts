import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../common/decorators/public.decorator';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { getBlackListKey } from '../common/config/redis.key';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly reflector: Reflector,
    @InjectRedis() private readonly redis: Redis,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    let token = request.headers.authorization as string;
    if (!token) {
      return false;
    }

    token = token.split(' ')[1];
    const blackListKey = getBlackListKey(token);
    const isBlackListed = await this.redis.exists(blackListKey);
    if (isBlackListed) {
      return false;
    }

    return super.canActivate(context) as any;
  }
}
