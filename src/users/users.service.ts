import {
  HttpStatus,
  Injectable,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { ConfigService } from '@nestjs/config';
import { hash } from 'bcrypt';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { getPermissionsKey } from '../common/config/redis.key';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { UserListItem } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  private generateHashPassword(password: string) {
    return hash(password, +this.configService.get('BCRYPT_SALT_ROUNDS') || 10);
  }

  private async clearPermissionsCache(userId: string) {
    const key = getPermissionsKey(userId);
    const hasKey = await this.redis.exists(key);
    if (hasKey) {
      this.redis.del(key);
    }
  }

  isDefaultAdministrator(userName: string) {
    const defaultName = this.configService.get('DEFAULT_USERNAME') || 'sAdmin';
    return userName === defaultName;
  }

  private async findUserName(id: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id, deleted: false },
      select: { userName: true },
    });

    if (!user) {
      throw new NotFoundException('The user does not exist');
    }

    return user.userName;
  }

  async validateUser(userName: string) {
    return this.prismaService.user.findFirst({
      where: {
        userName,
        deleted: false,
        disabled: false,
      },
      select: { id: true, userName: true, password: true },
    });
  }

  async create(createUserDto: CreateUserDto) {
    const user = await this.prismaService.user.findUnique({
      where: { userName: createUserDto.userName },
      select: { id: true },
    });
    if (user) {
      throw new NotAcceptableException('The user name already exists');
    }

    const password = this.configService.get('DEFAULT_PASSWORD') || 'd.123456';
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

    const sql = `WITH ranked_users AS (
    SELECT
        u.id,
        u.user_name,
        u.disabled,
        u.created_at,
        u.updated_at,
        p.avatar,
        p.nick_name,
        CASE WHEN COUNT(r.name) > 0 THEN ARRAY_AGG(r.name)
        ELSE ARRAY[]::VARCHAR[] END AS role_names,
        COUNT(*) OVER() AS total_count
    FROM users u
        JOIN profiles p ON u.id = p.user_id
        LEFT JOIN role_in_user ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
    WHERE u.deleted = false${whereCondition}
    GROUP BY u.id, u.user_name, u.disabled, u.created_at, u.updated_at, p.avatar, p.nick_name)
    SELECT * FROM ranked_users ORDER BY created_at ${sort} LIMIT ${limit} OFFSET ${offset}`;

    const users = (await this.prismaService.$queryRawUnsafe(sql)) as any[];
    if (!users || users?.length === 0) {
      return { list: [], total: 0 };
    }
    const total = Number(users[0].total_count);
    const list: UserListItem[] = users.map((user) => {
      return {
        id: user.id,
        userName: user.user_name,
        disabled: user.disabled,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        avatar: user.avatar,
        nickName: user.nick_name,
        roleNames: user.role_names,
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
      if (!updateUserDto.roles?.includes(1)) {
        return {
          statusCode: HttpStatus.NOT_ACCEPTABLE,
          message:
            'The super administrator must have the super administrator role',
        };
      }
    }

    await this.prismaService.user.update({
      where: { id, deleted: false },
      data: {
        disabled: updateUserDto.disabled,
        profile: {
          update: {
            nickName: updateUserDto.nickName,
          },
        },
        roleInUser: updateUserDto.roles && {
          deleteMany: {},
          createMany: {
            data: updateUserDto.roles.map((roleId) => ({
              roleId,
            })),
          },
        },
      },
    });

    if (updateUserDto.roles) {
      this.clearPermissionsCache(id);
    }
  }

  async remove(id: string) {
    const userName = await this.findUserName(id);
    if (this.isDefaultAdministrator(userName)) {
      throw new NotAcceptableException(
        'The super administrator cannot be deleted',
      );
    }

    await this.prismaService.user.update({
      where: { id },
      data: { deleted: true },
    });
  }

  async batchRemove(ids: string[]) {
    const userNames = await this.prismaService.user.findMany({
      where: { id: { in: ids }, deleted: false },
      select: { userName: true },
    });

    if (userNames.length !== ids.length) {
      throw new NotFoundException('Some users do not exist');
    }

    if (
      userNames.some(({ userName }) => this.isDefaultAdministrator(userName))
    ) {
      throw new NotAcceptableException(
        'The super administrator cannot be deleted',
      );
    }

    await this.prismaService.user.updateMany({
      where: { id: { in: ids } },
      data: { deleted: true },
    });
  }
}
