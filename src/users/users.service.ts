import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { ConfigService } from '@nestjs/config';
import { hash } from 'bcrypt';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { getPermissionsKey } from '../common/config/redis.key';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserListItem } from './entities/user.entity';
import getSystemConfig from '../common/config';
import dayjs from 'dayjs';

import type { IProfile } from '../common/types/index.d';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  private generateHashPassword(password: string) {
    return hash(
      password,
      getSystemConfig(this.configService).BCRYPT_SALT_ROUNDS,
    );
  }

  private getDefaultPassword() {
    return getSystemConfig(this.configService).DEFAULT_PASSWORD;
  }

  private async clearPermissionsCache(userId: string) {
    const key = getPermissionsKey(userId);
    const hasKey = await this.redis.exists(key);
    if (hasKey) {
      this.redis.del(key);
    }
  }

  isDefaultAdministrator(userName: string) {
    const defaultName = getSystemConfig(this.configService).DEFAULT_USERNAME;
    return userName === defaultName;
  }

  async create(createUserDto: CreateUserDto) {
    const user = await this.prismaService.user.findUnique({
      where: { userName: createUserDto.userName },
      select: { id: true },
    });
    if (user) {
      return {
        statusCode: HttpStatus.CONFLICT,
        message: 'The user already exists',
      };
    }

    const password = this.getDefaultPassword();
    const hashedPassword = await this.generateHashPassword(password);

    await this.prismaService.user.create({
      data: {
        userName: createUserDto.userName,
        password: hashedPassword,
        disabled: createUserDto.disabled,
        profile: {
          create: {
            nickName: createUserDto.nickName,
          },
        },
        roleInUser: createUserDto.roles && {
          createMany: {
            data: createUserDto.roles.map((roleId) => ({
              roleId,
            })),
          },
        },
      },
    });
  }

  async findAll(queryUserDto: QueryUserDto) {
    let whereCondition = '';
    if (queryUserDto.disabled !== undefined) {
      whereCondition += ` AND u.disabled = ${queryUserDto.disabled}`;
    }
    if (queryUserDto.keyword) {
      whereCondition += ` AND (u.user_name ILIKE '%${queryUserDto.keyword}%' OR p.nick_name ILIKE '%${queryUserDto.keyword}%')`;
    }
    if (queryUserDto.beginTime) {
      whereCondition += ` AND u.created_at >= '${queryUserDto.beginTime}'`;
    }
    if (queryUserDto.endTime) {
      whereCondition += ` AND u.created_at <= '${queryUserDto.endTime}'`;
    }

    const sort = queryUserDto.sort === 'desc' ? 'DESC' : 'ASC';
    const limit = queryUserDto.pageSize;
    const offset = queryUserDto.pageSize * (queryUserDto.page - 1);

    const sql = `
    WITH filtered_users AS (
      SELECT
        u.id, u.user_name, u.disabled, u.created_at, u.updated_at, p.avatar, p.nick_name
      FROM users u JOIN profiles p ON u.id = p.user_id
      WHERE u.deleted = false${whereCondition}
    ),
    user_roles AS (
      SELECT
        ur.user_id, STRING_AGG(r.name, ',' ORDER BY r.name) AS role_names
      FROM role_in_user ur JOIN roles r ON ur.role_id = r.id
      WHERE r.deleted = false AND r.disabled = false
      GROUP BY ur.user_id
    ),
    total_count AS (SELECT COUNT(*) AS count FROM filtered_users)
    SELECT fu.*, ur.role_names, tc.count AS total_count FROM filtered_users fu
    LEFT JOIN user_roles ur ON fu.id = ur.user_id
    CROSS JOIN total_count tc
    ORDER BY fu.created_at ${sort} LIMIT ${limit} OFFSET ${offset};
    `;

    const users = (await this.prismaService.$queryRawUnsafe(sql)) as any[];
    if (!users || users?.length === 0) {
      return { list: [], total: 0 };
    }

    const total = Number(users[0].total_count);
    const list: UserListItem[] = users.map((user) => {
      let roleNames = user.role_names;
      if (roleNames) {
        roleNames = roleNames.split(',');
      }

      return {
        id: user.id,
        userName: user.user_name,
        disabled: user.disabled,
        createdAt: dayjs(user.created_at).format('YYYY-MM-DD HH:mm:ss'),
        updatedAt: dayjs(user.updated_at).format('YYYY-MM-DD HH:mm:ss'),
        avatar: user.avatar,
        nickName: user.nick_name,
        roleNames,
      };
    });

    return { list, total };
  }

  async findOne(id: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id, deleted: false },
      select: {
        userName: true,
        disabled: true,
        createdAt: true,
        profile: {
          select: { nickName: true },
        },
        roleInUser: {
          select: {
            roleId: true,
          },
        },
      },
    });

    if (!user) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'The user does not exist',
      };
    }

    const profile = user.profile;
    const roles = user.roleInUser.map((role) => role.roleId);

    return {
      userName: user.userName,
      disabled: user.disabled,
      createdAt: user.createdAt,
      ...profile,
      roles,
    };
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.prismaService.user.findUnique({
      where: { id, deleted: false },
      select: { userName: true },
    });
    if (!user) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'The user does not exist',
      };
    }

    if (this.isDefaultAdministrator(user.userName)) {
      if (updateUserDto.disabled) {
        return {
          statusCode: HttpStatus.NOT_ACCEPTABLE,
          message: 'The super administrator cannot be disabled',
        };
      }
      if (
        updateUserDto.roles !== undefined &&
        !updateUserDto.roles?.includes(1)
      ) {
        return {
          statusCode: HttpStatus.NOT_ACCEPTABLE,
          message:
            'The super administrator must have the super administrator role',
        };
      }
    }

    const data: Prisma.UserUpdateInput = {
      disabled: updateUserDto.disabled,
      profile: {
        update: {
          nickName: updateUserDto.nickName,
        },
      },
    };
    if (updateUserDto.roles || updateUserDto.roles === null) {
      data.roleInUser = {
        deleteMany: {},
      };

      if (updateUserDto.roles.length) {
        data.roleInUser.createMany = {
          data: updateUserDto.roles.map((roleId) => ({
            roleId,
          })),
        };
      }
    }

    await this.prismaService.user.update({
      where: { id, deleted: false },
      data,
    });

    if (updateUserDto.roles) {
      this.clearPermissionsCache(id);
    }
  }

  async remove(id: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id, deleted: false },
      select: { userName: true },
    });

    if (!user) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'The user does not exist',
      };
    }
    if (this.isDefaultAdministrator(user.userName)) {
      return {
        statusCode: HttpStatus.NOT_ACCEPTABLE,
        message: 'The super administrator cannot be deleted',
      };
    }

    await this.prismaService.user.update({
      where: { id },
      data: { deleted: true },
    });
  }

  async batchRemove(ids: string[]) {
    const users = await this.prismaService.user.findMany({
      where: { id: { in: ids }, deleted: false },
      select: { userName: true },
    });

    if (users.length !== ids.length) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Some users do not exist',
      };
    }

    if (users.some(({ userName }) => this.isDefaultAdministrator(userName))) {
      return {
        statusCode: HttpStatus.NOT_ACCEPTABLE,
        message: 'The super administrator cannot be deleted',
      };
    }

    await this.prismaService.user.updateMany({
      where: { id: { in: ids } },
      data: { deleted: true },
    });
  }

  async findProfile(id: string) {
    const profile: IProfile[] = await this.prismaService.$queryRaw`
      WITH user_base AS (SELECT id, user_name FROM users WHERE id = ${id})
      SELECT ub.user_name, p.avatar, p.nick_name, p.birthday, p.description, p.email, p.gender, 
      p.phone, COALESCE(string_agg(r.name, ','), '') AS role_names
      FROM user_base ub
      INNER JOIN profiles p ON ub.id = p.user_id
      LEFT JOIN role_in_user ur ON ub.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      GROUP BY ub.id, ub.user_name, p.id, p.avatar, p.nick_name, p.birthday, p.description, 
      p.email, p.gender, p.phone;
    `;

    if (!profile || profile.length === 0) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'The user does not exist',
      };
    }

    const userInfo = profile[0];
    return {
      userName: userInfo.user_name,
      nickName: userInfo.nick_name,
      roles: userInfo.role_names ? userInfo.role_names.split(',') : [],
      avatar: userInfo.avatar,
      email: userInfo.email,
      phone: userInfo.phone,
      gender: userInfo.gender,
      birthday: userInfo.birthday
        ? dayjs(userInfo.birthday).format('YYYY-MM-DD')
        : '',
      description: userInfo.description,
    };
  }

  async updateProfile(id: string, profile: UpdateProfileDto) {
    if (profile.birthday) {
      profile.birthday = profile.birthday.slice(0, 10) + 'T00:00:00Z';
    }

    await this.prismaService.profile.update({
      where: { userId: id },
      data: profile,
    });
  }

  async exportAll() {
    const users = await this.prismaService.user.findMany({
      where: { deleted: false },
      select: {
        userName: true,
        profile: {
          select: {
            nickName: true,
            phone: true,
            email: true,
            gender: true,
            birthday: true,
          },
        },
      },
    });

    if (!users || users.length === 0) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'No user data',
      };
    }

    const data = users.map((user) => {
      const profile = user.profile;
      const gender =
        profile.gender === 'FE'
          ? '女'
          : profile.gender === 'MA'
            ? '男'
            : '其他';

      return {
        userName: user.userName,
        nickName: profile.nickName,
        phone: profile.phone,
        email: profile.email,
        birthday: profile.birthday,
        gender,
      };
    });

    return data;
  }

  async resetPassword(id: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id, deleted: false },
      select: { userName: true },
    });
    if (!user) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'The user does not exist',
      };
    }
    if (this.isDefaultAdministrator(user.userName)) {
      return {
        statusCode: HttpStatus.NOT_ACCEPTABLE,
        message: 'The super administrator cannot be reset password',
      };
    }

    const defaultPassword = this.getDefaultPassword();
    const password = await this.generateHashPassword(defaultPassword);

    await this.prismaService.user.update({
      where: { id },
      data: { password },
    });
  }
}
