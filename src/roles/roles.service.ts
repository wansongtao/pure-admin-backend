import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { ConfigService } from '@nestjs/config';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { getPermissionsKey } from '../common/config/redis.key';
import { Prisma } from '@prisma/client';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { QueryRoleDto } from './dto/query-role.dto';

@Injectable()
export class RolesService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  private isDefaultAdministrator(roleName: string) {
    const defaultName =
      this.configService.get<string>('DEFAULT_ROLE_NAME') || 'admin';
    return roleName === defaultName;
  }

  private clearPermissionsCache(userIds: string[]) {
    userIds.forEach(async (userId) => {
      const key = getPermissionsKey(userId);
      const hasKey = await this.redis.exists(key);
      if (hasKey) {
        this.redis.del(key);
      }
    });
  }

  async create(createRoleDto: CreateRoleDto) {
    const role = await this.prismaService.role.findFirst({
      where: {
        name: createRoleDto.name,
      },
      select: {
        id: true,
      },
    });
    if (role) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'The name already exists',
      };
    }

    const data: Prisma.RoleCreateInput = {
      name: createRoleDto.name,
      description: createRoleDto.description,
      disabled: createRoleDto.disabled,
    };
    if (createRoleDto.permissions?.length) {
      data.roleInPermission = {
        create: createRoleDto.permissions.map((permissionId) => ({
          permissionId,
        })),
      };
    }

    await this.prismaService.role.create({
      data,
    });
  }

  async findAll(queryRoleDto: QueryRoleDto) {
    const whereCondition: Prisma.RoleWhereInput = {
      disabled: queryRoleDto.disabled,
      deleted: false,
      name: {
        contains: queryRoleDto.keyword,
        mode: 'insensitive',
      },
      createdAt: {
        gte: queryRoleDto.beginTime,
        lte: queryRoleDto.endTime,
      },
    };

    const results = await this.prismaService.$transaction([
      this.prismaService.role.findMany({
        where: whereCondition,
        select: {
          id: true,
          name: true,
          description: true,
          disabled: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: queryRoleDto.sort,
        },
        take: queryRoleDto.pageSize,
        skip: (queryRoleDto.page - 1) * queryRoleDto.pageSize,
      }),
      this.prismaService.role.count({ where: whereCondition }),
    ]);

    return {
      list: results[0],
      total: results[1],
    };
  }

  async findOne(id: number) {
    const role = await this.prismaService.role.findUnique({
      where: {
        id,
        deleted: false,
      },
      select: {
        id: true,
        name: true,
        description: true,
        disabled: true,
        roleInPermission: {
          select: {
            permissionId: true,
          },
        },
      },
    });

    if (!role) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Role not found',
      };
    }

    const permissions = role.roleInPermission.map(
      (roleInPermission) => roleInPermission.permissionId,
    );

    return {
      id: role.id,
      name: role.name,
      description: role.description,
      disabled: role.disabled,
      permissions,
    };
  }

  async update(id: number, updateRoleDto: UpdateRoleDto) {
    const role = await this.prismaService.role.findUnique({
      where: {
        id,
        deleted: false,
      },
      select: {
        name: true,
        roleInUser: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!role) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Role not found',
      };
    }

    if (this.isDefaultAdministrator(role.name)) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'The default administrator role cannot be modified',
      };
    }

    const data: Prisma.RoleUpdateInput = {
      name: updateRoleDto.name,
      description: updateRoleDto.description,
      disabled: updateRoleDto.disabled,
    };
    if (updateRoleDto.permissions || updateRoleDto.permissions === null) {
      data.roleInPermission = {
        deleteMany: {},
      };

      if (updateRoleDto.permissions.length) {
        data.roleInPermission.create = updateRoleDto.permissions.map(
          (permissionId) => ({
            permissionId,
          }),
        );
      }
    }

    await this.prismaService.role.update({
      where: {
        id,
      },
      data,
    });

    if (
      role.roleInUser.length &&
      (updateRoleDto.disabled !== undefined ||
        updateRoleDto.permissions !== undefined)
    ) {
      this.clearPermissionsCache(
        role.roleInUser.map((roleInUser) => roleInUser.userId),
      );
    }
  }

  async remove(id: number) {
    const role = await this.prismaService.role.findUnique({
      where: {
        id,
        deleted: false,
      },
      select: {
        name: true,
        roleInUser: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!role) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Role not found',
      };
    }

    if (role.roleInUser.length) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'The role has been assigned to the user and cannot be deleted',
      };
    }

    await this.prismaService.role.update({
      where: {
        id,
      },
      data: {
        deleted: true,
      },
    });
  }

  async batchRemove(ids: number[]) {
    const roles = await this.prismaService.role.findMany({
      where: {
        id: {
          in: ids,
        },
        deleted: false,
      },
      select: {
        name: true,
        roleInUser: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (roles.length !== ids.length) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Some roles not found',
      };
    }

    const hasUser = roles.some((role) => role.roleInUser.length > 0);
    if (hasUser) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message:
          'Some roles have been assigned to the user and cannot be deleted',
      };
    }

    await this.prismaService.role.updateMany({
      where: {
        id: {
          in: ids,
        },
      },
      data: {
        deleted: true,
      },
    });
  }

  async findRolesById(ids: number[]) {
    const roleInfos = await this.prismaService.role.findMany({
      where: {
        disabled: false,
        deleted: false,
        id: {
          in: ids,
        },
      },
      select: {
        name: true,
        roleInPermission: {
          select: {
            permissionId: true,
          },
        },
      },
    });

    return roleInfos.map((roleInfo) => {
      return {
        name: roleInfo.name,
        permissionIds: roleInfo.roleInPermission.map(
          (roleInPermission) => roleInPermission.permissionId,
        ),
      };
    });
  }

  findAllRoles() {
    return this.prismaService.role.findMany({
      where: {
        disabled: false,
        deleted: false,
      },
      select: {
        id: true,
        name: true,
      },
    });
  }
}
