import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { createHash } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as svgCaptcha from 'svg-captcha';
import * as bcrypt from 'bcrypt';
import Redis from 'ioredis';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    @InjectRedis() private readonly redis: Redis,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  private generateKey(ip: string, userAgent: string) {
    const data = `${ip}:${userAgent}`;
    return createHash('sha256').update(data).digest('hex');
  }

  generateCaptcha(ip: string, userAgent: string) {
    const captcha = svgCaptcha.create({
      size: 4,
      noise: 2,
      color: true,
      background: '#f0f0f0',
    });

    const key = this.generateKey(ip, userAgent);
    const expiresIn = +this.configService.get('CAPTCHA_EXPIRES_IN') || 120;
    this.redis.set(key, captcha.text, 'EX', expiresIn);

    return {
      captcha: `data:image/svg+xml;base64,${Buffer.from(captcha.data).toString('base64')}`,
    };
  }

  async verifyCaptcha(ip: string, userAgent: string, captcha: string) {
    const key = this.generateKey(ip, userAgent);
    const captchaInRedis = await this.redis.get(key);
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

    const user = await this.usersService.validateUser(userName);
    if (!user) {
      throw new NotFoundException(`No user found for userName: ${userName}`);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Password is invalid');
    }

    const payload = { userId: user.id, username: user.userName };
    const token = this.jwtService.sign(payload);
    return { token };
  }

  logout(token: string) {
    this.redis.set(token, '', 'EX', +this.configService.get('JWT_EXPIRES_IN'));
  }
}
