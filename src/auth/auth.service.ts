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
import { RolesService } from '../roles/roles.service';
import { PermissionsService } from '../permissions/permissions.service';
import * as svgCaptcha from 'svg-captcha';
import * as bcrypt from 'bcrypt';
import Redis from 'ioredis';
import { UserInfoEntity } from './entities/auth.entity';
import { generateMenus } from '../common/utils';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    @InjectRedis() private readonly redis: Redis,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly rolesService: RolesService,
    private readonly permissionsService: PermissionsService,
  ) {}

  getDefaultAdminPermission() {
    const defaultPermission =
      this.configService.get<string>('DEFAULT_SUPER_PERMISSION') || '*:*:*';
    return defaultPermission;
  }

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
    if (
      captchaInRedis &&
      captchaInRedis.toLowerCase() === captcha.toLowerCase()
    ) {
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

    const payload = { userId: user.id, userName: user.userName };
    const token = this.jwtService.sign(payload, { algorithm: 'RS256' });
    this.redis.set(
      `login:${user.id}`,
      token,
      'EX',
      +this.configService.get('JWT_EXPIRES_IN') || 86400,
    );
    return { token };
  }

  logout(token: string) {
    this.redis.set(
      token,
      '',
      'EX',
      +this.configService.get('JWT_EXPIRES_IN') || 86400,
    );
  }

  async getUserInfo(userId: string) {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new NotFoundException(`No user found for userId: ${userId}`);
    }

    const userInfo: UserInfoEntity = {
      name: user.nickName ?? user.userName,
      avatar: user.avatar ?? '',
      roles: [],
      permissions: [],
      menus: [],
    };

    const defaultPermission = this.getDefaultAdminPermission();
    if (this.usersService.isDefaultAdministrator(user.userName)) {
      userInfo.permissions = [defaultPermission];
    }
    if (!user.roles.length) {
      return userInfo;
    }

    const roles = await this.rolesService.findRolesById(user.roles);
    if (!roles.length) {
      return userInfo;
    }
    userInfo.roles = roles.map((role) => role.name);

    const tempPermissionIds = roles.reduce((acc, role) => {
      return acc.concat(role.permissionIds);
    }, []);
    if (!tempPermissionIds.length) {
      return userInfo;
    }

    const permissionIds = Array.from(new Set(tempPermissionIds));
    const permissionInfos =
      await this.permissionsService.findPermissionsById(permissionIds);
    if (!permissionInfos.length) {
      return userInfo;
    }

    if (!userInfo.permissions.includes(defaultPermission)) {
      userInfo.permissions = permissionInfos.map((item) => item.permission);
    }

    const menus = generateMenus(
      permissionInfos.filter((item) => item.type !== 'BUTTON'),
    );
    userInfo.menus = menus;

    return userInfo;
  }

  async findUserPermissions(userId: string) {
    const permissions = await this.redis.smembers(`permissions:${userId}`);
    if (permissions?.length) {
      return permissions;
    }

    const user = await this.usersService.findOne(userId);
    if (!user || !user.roles?.length) {
      return [];
    }
    if (this.usersService.isDefaultAdministrator(user.userName)) {
      const defaultPermission = this.getDefaultAdminPermission();
      return [defaultPermission];
    }

    const userPermissions =
      await this.permissionsService.findPermissionsByRoleId(user.roles);
    if (!userPermissions.length) {
      return [];
    }

    this.redis.sadd(`permissions:${userId}`, userPermissions);
    this.redis.expire(
      `permissions:${userId}`,
      +this.configService.get('JWT_EXPIRES_IN') || 86400,
    );

    return userPermissions;
  }
}
