import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as svgCaptcha from 'svg-captcha';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { createHash } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'nestjs-prisma';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import type Redis from 'ioredis';

@Injectable()
export class AuthService {
  constructor(
    private readonly config: ConfigService,
    @InjectRedis() private readonly redis: Redis,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  private generateKey(ip: string, userAgent: string) {
    const data = `${ip}:${userAgent}`;
    return createHash('sha256').update(data).digest('hex');
  }

  generateCaptcha(ip: string, userAgent: string) {
    const captcha = svgCaptcha.create();
    const key = this.generateKey(ip, userAgent);
    this.redis.set(
      key,
      captcha.text,
      'EX',
      +this.config.get('CAPTCHA_EXPIRES_IN'),
    );

    return `data:image/svg+xml;base64,${Buffer.from(captcha.data).toString('base64')}`;
  }

  async verifyCaptcha(ip: string, userAgent: string, captcha: string) {
    const key = this.generateKey(ip, userAgent);
    const captchaInRedis = await this.redis.get(`captcha: ${key}`);
    if (captchaInRedis === captcha) {
      this.redis.del(key);
      return true;
    }

    return false;
  }

  async login(
    userName: string,
    password: string,
    captcha: string,
    { ip, userAgent }: { ip: string; userAgent: string },
  ) {
    const isCaptchaValid = await this.verifyCaptcha(ip, userAgent, captcha);
    if (!isCaptchaValid) {
      throw new UnauthorizedException('Captcha is invalid');
    }

    const user = await this.prisma.user.findUnique({
      where: { userName, deleted: false, disabled: false },
    });

    if (!user) {
      throw new NotFoundException(`No user found for userName: ${userName}`);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Password is invalid');
    }

    const payload = { userId: user.id, username: user.userName };
    return this.jwtService.sign(payload);
  }
}
