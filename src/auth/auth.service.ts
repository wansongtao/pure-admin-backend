import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as svgCaptcha from 'svg-captcha';
import * as bcrypt from 'bcrypt';
import Redis from 'ioredis';
import { UserInfoEntity } from './entities/auth.entity';
import { generateMenus } from '../common/utils';
import {
  getSSOKey,
  getCaptchaKey,
  getBlackListKey,
  getPermissionsKey,
} from '../common/config/redis.key';
import { PrismaService } from 'nestjs-prisma';
import { PasswordDto } from './dto/password.dto';
import getSystemConfig from '../common/config';

import type { IPayload, IUserPermission } from '../common/types';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    @InjectRedis() private readonly redis: Redis,
    private readonly jwtService: JwtService,
    private readonly prismaService: PrismaService,
  ) {}

  getDefaultAdminPermission() {
    return getSystemConfig(this.configService).DEFAULT_SUPER_PERMISSION;
  }

  isDefaultAdministrator(userName: string) {
    const defaultName = getSystemConfig(this.configService).DEFAULT_USERNAME;
    return userName === defaultName;
  }

  private savePermissionsToRedis(userId: string, permissions: string[]) {
    const permissionsKey = getPermissionsKey(userId);
    this.redis.sadd(permissionsKey, permissions);
    this.redis.expire(
      permissionsKey,
      getSystemConfig(this.configService).JWT_EXPIRES_IN,
    );
  }

  generateCaptcha(ip: string, userAgent: string) {
    const captcha = svgCaptcha.create({
      size: 4,
      noise: 2,
      color: true,
      background: '#f0f0f0',
    });

    const key = getCaptchaKey(ip, userAgent);
    const expiresIn = getSystemConfig(this.configService).CAPTCHA_EXPIRES_IN;
    this.redis.set(key, captcha.text, 'EX', expiresIn);

    return {
      captcha: `data:image/svg+xml;base64,${Buffer.from(captcha.data).toString('base64')}`,
    };
  }

  async verifyCaptcha(ip: string, userAgent: string, captcha: string) {
    const key = getCaptchaKey(ip, userAgent);
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
      throw new BadRequestException('Captcha is invalid');
    }

    const user = await this.prismaService.user.findUnique({
      where: { userName, deleted: false, disabled: false },
      select: { id: true, password: true },
    });
    if (!user) {
      throw new BadRequestException('UserName is invalid');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Password is invalid');
    }

    const config = getSystemConfig(this.configService);

    const payload: IPayload = { userId: user.id };
    const accessToken = this.jwtService.sign(payload, {
      algorithm: config.JWT_ALGORITHM,
      expiresIn: config.JWT_EXPIRES_IN,
    });
    const refreshToken = this.jwtService.sign(payload, {
      algorithm: config.JWT_ALGORITHM,
      expiresIn: config.JWT_REFRESH_TOKEN_EXPIRES_IN,
    });

    const ssoKey = getSSOKey(user.id);
    this.redis.set(ssoKey, accessToken, 'EX', config.JWT_EXPIRES_IN);

    return { accessToken, refreshToken };
  }

  logout(accessToken: string) {
    const blackListKey = getBlackListKey(accessToken);
    this.redis.set(
      blackListKey,
      '',
      'EX',
      getSystemConfig(this.configService).JWT_EXPIRES_IN,
    );
  }

  async getUserInfo(userId: string) {
    const userPermissions: IUserPermission[] = await this.prismaService
      .$queryRaw`
      WITH filtered_users AS (
        SELECT u.id, u.user_name, p.avatar, p.nick_name
        FROM users u
            LEFT JOIN profiles p ON u.id = p.user_id
        WHERE u.id = ${userId}
      ),
      user_roles AS (
        SELECT ur.user_id, 
        STRING_AGG(r.name, ','ORDER BY r.name) AS role_names, 
        ARRAY_AGG(r.id) AS role_ids
        FROM role_in_user ur
        JOIN roles r ON ur.role_id = r.id AND r.disabled = false
        WHERE ur.user_id IN (SELECT id FROM filtered_users)
        GROUP BY ur.user_id
      ),
      role_permissions AS (
        SELECT DISTINCT
            ur.user_id, p.pid, p.id, p.name, p.path, p.permission, p.type, p.icon, 
            p.component, p.redirect, p.hidden, p.sort, p.cache, p.props
        FROM user_roles ur
          JOIN role_in_permission rp ON rp.role_id = ANY (ur.role_ids)
          JOIN permissions p ON rp.permission_id = p.id AND p.disabled = false
      )
      SELECT fu.user_name, fu.nick_name, fu.avatar, ur.role_names, rp.pid,
      rp.id, rp.name, rp.path, rp.permission, rp.type, rp.icon, rp.component, rp.redirect, rp.hidden, 
      rp.sort, rp.cache, rp.props
      FROM filtered_users fu
        LEFT JOIN user_roles ur ON fu.id = ur.user_id
        LEFT JOIN role_permissions rp ON fu.id = rp.user_id
      ORDER BY rp.sort DESC;
    `;

    if (!userPermissions?.length) {
      throw new NotFoundException('User not found');
    }

    const userInfo: UserInfoEntity = {
      name: '',
      avatar: '',
      roles: [],
      permissions: [],
      menus: [],
    };

    const userPermission = userPermissions[0];
    userInfo.name = userPermission.nick_name ?? userPermission.user_name;
    userInfo.avatar = userPermission.avatar ?? '';
    userInfo.roles = !!userPermission.role_names
      ? userPermission.role_names.split(',')
      : [];

    if (!userInfo.roles.length) {
      return userInfo;
    }

    if (this.isDefaultAdministrator(userPermission.user_name)) {
      userInfo.permissions = [this.getDefaultAdminPermission()];
    } else {
      userInfo.permissions = userPermissions
        .filter((item) => item.permission)
        .map((item) => item.permission);
    }

    const tempMenus = userPermissions
      .filter((item) => item.type && item.type !== 'BUTTON')
      .map((item) => {
        return {
          id: item.id,
          pid: item.pid,
          name: item.name,
          path: item.path,
          component: item.component,
          cache: item.cache,
          hidden: item.hidden,
          icon: item.icon,
          redirect: item.redirect,
          props: item.props,
        };
      });

    const menus = generateMenus(tempMenus);
    userInfo.menus = menus;
    return userInfo;
  }

  async findUserPermissions(userId: string) {
    const permissionsKey = getPermissionsKey(userId);
    const permissions = await this.redis.smembers(permissionsKey);
    if (permissions?.length) {
      return permissions;
    }

    const results: { user_name: string; permissions?: string[] }[] = await this
      .prismaService.$queryRaw`
      WITH user_permissions AS (
      SELECT
        u.user_name,
        ARRAY_AGG(DISTINCT pe.permission) FILTER (WHERE pe.permission IS NOT NULL) AS permissions
      FROM
        users u
        LEFT JOIN role_in_user ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id AND r.deleted = false AND r.disabled = false
        LEFT JOIN role_in_permission rp ON r.id = rp.role_id
        LEFT JOIN permissions pe ON rp.permission_id = pe.id AND pe.deleted = false AND pe.disabled = false
      WHERE u.id = ${userId} GROUP BY u.user_name)
      SELECT * FROM user_permissions;
      `;

    if (!results.length) {
      this.savePermissionsToRedis(userId, []);
      return [];
    }

    const userName = results[0].user_name;
    if (this.isDefaultAdministrator(userName)) {
      const defaultPermissions = [this.getDefaultAdminPermission()];
      this.savePermissionsToRedis(userId, defaultPermissions);
      return defaultPermissions;
    }

    const userPermissions = results[0].permissions ?? [];
    this.savePermissionsToRedis(userId, userPermissions);
    return userPermissions;
  }

  async updatePassword(passwordDto: PasswordDto, userId: string) {
    if (passwordDto.oldPassword === passwordDto.newPassword) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'oldPassword and newPassword cannot be the same',
      };
    }

    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });
    if (!user) {
      return { statusCode: HttpStatus.NOT_FOUND, message: 'User not found' };
    }

    const isPasswordValid = await bcrypt.compare(
      passwordDto.oldPassword,
      user.password,
    );
    if (!isPasswordValid) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'oldPassword is invalid',
      };
    }

    const hashPassword = await bcrypt.hash(
      passwordDto.newPassword,
      getSystemConfig(this.configService).BCRYPT_SALT_ROUNDS,
    );
    await this.prismaService.user.update({
      where: { id: userId },
      data: { password: hashPassword },
    });
  }

  async refreshToken(refreshToken: string, accessToken: string) {
    const blackListKey = getBlackListKey(accessToken);
    const isTokenInBlackList = await this.redis.exists(blackListKey);
    if (isTokenInBlackList) {
      throw new UnauthorizedException('Token is invalid');
    }

    let userId: string;
    try {
      userId = this.jwtService.verify<IPayload>(refreshToken).userId;
    } catch {
      throw new UnauthorizedException('Please login again');
    }

    const ssoKey = getSSOKey(userId);
    const validToken = await this.redis.get(ssoKey);
    if (validToken && validToken !== accessToken) {
      throw new UnauthorizedException('Sign in elsewhere');
    }

    const user = await this.prismaService.user.findUnique({
      where: { id: userId, deleted: false, disabled: false },
      select: { id: true },
    });
    if (!user) {
      throw new UnauthorizedException('No user found');
    }

    const config = getSystemConfig(this.configService);
    const payload: IPayload = { userId: userId };
    const newAccessToken = this.jwtService.sign(payload, {
      algorithm: config.JWT_ALGORITHM,
      expiresIn: config.JWT_EXPIRES_IN,
    });
    const newRefreshToken = this.jwtService.sign(payload, {
      algorithm: config.JWT_ALGORITHM,
      expiresIn: config.JWT_REFRESH_TOKEN_EXPIRES_IN,
    });

    this.redis.set(ssoKey, newAccessToken, 'EX', config.JWT_EXPIRES_IN);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }
}
