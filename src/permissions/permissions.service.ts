import {
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { generateMenus } from '../common/utils/index';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { QueryPermissionDto } from './dto/query-permission.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class PermissionsService {
  constructor(private readonly prismaService: PrismaService) {}

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
              id: updatePermissionDto.pid,
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

    await this.prismaService.permission
      .update({
        where: {
          id,
        },
        data: updatePermissionDto,
      })
      .catch(() => {
        throw new InternalServerErrorException('Failed to update permission');
      });
  }

  remove(id: number) {
    return `This action removes a #${id} permission`;
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

  async findTree() {
    const permissions = await this.prismaService.permission.findMany({
      where: {
        disabled: false,
        deleted: false,
        type: {
          not: 'BUTTON',
        },
      },
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
