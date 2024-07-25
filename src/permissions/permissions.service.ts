import {
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { generateMenus } from '../common/utils/index';
import { Prisma } from '@prisma/client';
import { getPermissionsKey } from '../common/config/redis.key';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { QueryPermissionDto } from './dto/query-permission.dto';

@Injectable()
export class PermissionsService {
  constructor(
    private readonly prismaService: PrismaService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  private async validatePermission(permissionDto: CreatePermissionDto) {
    if (permissionDto.type !== 'BUTTON' && !permissionDto.path) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'The menu path cannot be empty',
      };
    }

    if (permissionDto.type === 'MENU' && !permissionDto.component) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'The menu component address cannot be empty',
      };
    }

    if (permissionDto.type === 'BUTTON' && !permissionDto.permission) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'The button permission identifier cannot be empty',
      };
    }

    const permission = await this.prismaService.permission.findFirst({
      where: {
        OR: [
          {
            id: permissionDto.pid,
          },
          {
            name: permissionDto.name,
          },
          {
            permission: permissionDto.permission,
          },
        ],
        deleted: false,
      },
      select: {
        type: true,
        name: true,
        permission: true,
      },
    });

    if (!permission) {
      if (permissionDto.pid) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'The parent menu does not exist',
        };
      }
      return;
    }

    if (permission.name === permissionDto.name) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'The menu name already exists',
      };
    }

    if (permission.permission === permissionDto.permission) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'The permission identifier already exists',
      };
    }

    if (permission.type === 'BUTTON') {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'The parent menu cannot be a button',
      };
    }

    if (permission.type === 'MENU' && permissionDto.type !== 'BUTTON') {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Only buttons can be added under the menu',
      };
    }
  }

  private async changePermissionsCache(
    deletePermission: string,
    updatePermission?: string,
    mode: 'update' | 'delete' = 'update',
  ) {
    const prefix = getPermissionsKey('');
    const keys = await this.redis.keys(`${prefix}*`);
    keys.forEach(async (key) => {
      const permissions = await this.redis.smembers(key);
      if (!permissions.includes(deletePermission)) {
        return;
      }

      if (mode === 'delete') {
        this.redis.del(key);
        return;
      }

      this.redis.srem(key, deletePermission);
      if (updatePermission) {
        this.redis.sadd(key, updatePermission);
      }
    });
  }

  async create(createPermissionDto: CreatePermissionDto) {
    const validateResult = await this.validatePermission(createPermissionDto);
    if (validateResult) {
      return validateResult;
    }

    await this.prismaService.permission
      .create({
        data: createPermissionDto,
      })
      .catch(() => {
        throw new InternalServerErrorException('Failed to create permission');
      });
  }

  async findAll(query: QueryPermissionDto) {
    const {
      keyword,
      disabled,
      type,
      page,
      pageSize,
      sort,
      beginTime,
      endTime,
    } = query;

    const whereCondition: Prisma.PermissionWhereInput = {
      deleted: false,
      name: {
        contains: keyword,
        mode: 'insensitive',
      },
      disabled,
      type,
      createdAt: {
        gte: beginTime,
        lte: endTime,
      },
    };

    const permissions = await this.prismaService.permission.findMany({
      where: whereCondition,
      select: {
        id: true,
        pid: true,
        name: true,
        type: true,
        permission: true,
        icon: true,
        path: true,
        sort: true,
        disabled: true,
        createdAt: true,
      },
      orderBy: [
        {
          sort: 'desc',
        },
        {
          createdAt: sort,
        },
      ],
    });

    const offset = (page - 1) * pageSize;
    if (permissions.length < offset) {
      return { list: [], total: 0 };
    }

    const permissionTree = generateMenus(permissions);
    if (permissionTree.length < offset) {
      return { list: [], total: 0 };
    }
    const total = permissionTree.length;
    const list = permissionTree.slice(offset, offset + pageSize);
    return { list, total };
  }

  findOne(id: number) {
    return this.prismaService.permission.findUnique({
      where: {
        id,
        deleted: false,
      },
      select: {
        pid: true,
        name: true,
        type: true,
        path: true,
        permission: true,
        icon: true,
        cache: true,
        props: true,
        hidden: true,
        component: true,
        disabled: true,
        redirect: true,
        sort: true,
      },
    });
  }

  async update(id: number, updatePermissionDto: UpdatePermissionDto) {
    const permission = await this.prismaService.permission.findUnique({
      where: {
        id,
        deleted: false,
      },
      select: {
        id: true,
        name: true,
        permission: true,
        type: true,
      },
    });

    if (!permission) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Permission does not exist',
      };
    }
    if (permission.id === updatePermissionDto.pid) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'The parent menu cannot be itself',
      };
    }

    if (
      updatePermissionDto.name ||
      updatePermissionDto.permission ||
      updatePermissionDto.pid
    ) {
      const otherPermission = await this.prismaService.permission.findFirst({
        where: {
          id: {
            not: id,
          },
          OR: [
            {
              id: updatePermissionDto.pid ?? undefined,
            },
            {
              name: updatePermissionDto.name,
            },
            {
              permission: updatePermissionDto.permission,
            },
          ],
        },
        select: {
          type: true,
          name: true,
          permission: true,
        },
      });

      if (otherPermission) {
        if (otherPermission.name === updatePermissionDto.name) {
          return {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'The menu name already exists',
          };
        }

        if (otherPermission.permission === updatePermissionDto.permission) {
          return {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'The permission identifier already exists',
          };
        }

        if (otherPermission.type === 'BUTTON') {
          return {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'The parent menu cannot be a button',
          };
        }

        if (otherPermission.type === 'MENU' && permission.type !== 'BUTTON') {
          return {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Only buttons can be added under the menu',
          };
        }
      }
    }

    if (updatePermissionDto.sort === null) {
      updatePermissionDto.sort = 0;
    }

    if (updatePermissionDto.disabled) {
      this.changePermissionsCache(permission.permission, '', 'delete');
    } else if (updatePermissionDto.permission !== undefined) {
      this.changePermissionsCache(
        permission.permission,
        updatePermissionDto.permission,
      );
    }

    await this.prismaService.permission.update({
      where: {
        id,
      },
      data: updatePermissionDto,
    });
  }

  async remove(id: number) {
    const permission = await this.prismaService.permission.findUnique({
      where: {
        id,
        deleted: false,
      },
      select: {
        id: true,
        name: true,
        children: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!permission) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Permission does not exist',
      };
    }

    if (permission.children.length > 0) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'The menu has submenus and cannot be deleted',
      };
    }

    await this.prismaService.permission.update({
      where: {
        id,
        deleted: false,
      },
      data: {
        deleted: true,
      },
    });
  }

  async batchRemove(ids: number[]) {
    const permissions = await this.prismaService.permission.findMany({
      where: {
        id: {
          in: ids,
        },
        deleted: false,
      },
      select: {
        id: true,
        name: true,
        children: {
          select: {
            id: true,
          },
        },
      },
    });

    if (permissions.length !== ids.length) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Some permissions do not exist',
      };
    }

    const hasChildren = permissions.some((item) => item.children.length > 0);
    if (hasChildren) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Some menus have submenus and cannot be deleted',
      };
    }

    await this.prismaService.permission.updateMany({
      where: {
        id: {
          in: ids,
        },
        deleted: false,
      },
      data: {
        deleted: true,
      },
    });
  }

  async findPermissionsById(ids: number[]) {
    const permissionInfos = await this.prismaService.permission.findMany({
      where: {
        disabled: false,
        deleted: false,
        id: {
          in: ids,
        },
      },
      select: {
        id: true,
        pid: true,
        name: true,
        type: true,
        permission: true,
        icon: true,
        path: true,
        component: true,
        redirect: true,
        hidden: true,
        cache: true,
        props: true,
        sort: true,
      },
      orderBy: {
        sort: 'desc',
      },
    });

    return permissionInfos;
  }

  async findPermissionsByRoleId(roleIds: number[]) {
    const permission = await this.prismaService.permission.findMany({
      where: {
        disabled: false,
        deleted: false,
        permission: {
          not: null,
        },
        roleInPermission: {
          some: {
            roleId: {
              in: roleIds,
            },
          },
        },
      },
      select: {
        permission: true,
      },
    });

    return permission.map((item) => item.permission);
  }

  async findTree(containButton: boolean) {
    const whereCondition: Prisma.PermissionWhereInput = {
      disabled: false,
      deleted: false,
    };
    if (!containButton) {
      whereCondition.type = {
        not: 'BUTTON',
      };
    }

    const permissions = await this.prismaService.permission.findMany({
      where: whereCondition,
      select: {
        id: true,
        pid: true,
        name: true,
        type: true,
      },
      orderBy: {
        sort: 'desc',
      },
    });

    const tree = generateMenus(permissions);
    return tree;
  }
}
