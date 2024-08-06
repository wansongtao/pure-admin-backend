import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { generateMenus } from '../common/utils/index';
import { Prisma, Permission } from '@prisma/client';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { QueryPermissionDto } from './dto/query-permission.dto';

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

    await this.prismaService.permission.create({
      data: createPermissionDto,
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
    if (id === updatePermissionDto.pid) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'The parent menu cannot be itself',
      };
    }

    let whereCondition = `(p.deleted = false AND p.id = ${id})`;
    if (updatePermissionDto.pid) {
      whereCondition += ` OR p.id = ${updatePermissionDto.pid}`;
    }
    if (updatePermissionDto.name) {
      whereCondition += ` OR p.name = '${updatePermissionDto.name}'`;
    }
    if (updatePermissionDto.permission) {
      whereCondition += ` OR p.permission = '${updatePermissionDto.permission}'`;
    }

    const permissions: {
      id: number;
      name: string;
      type: Permission['type'];
      permission?: string;
      role_names?: string;
    }[] = await this.prismaService.$queryRawUnsafe(`
      SELECT p.id, p.name, p.type, p.permission, STRING_AGG(r.name, ',') as role_names
      FROM permissions p
      LEFT JOIN role_in_permission rp ON p.id = rp.permission_id
      LEFT JOIN roles r ON rp.role_id = r.id AND r.deleted = false AND r.disabled = false
      WHERE ${whereCondition}
      GROUP BY p.id  
    `);

    const permission = permissions.find((item) => item.id === id);
    if (!permission) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Permission does not exist',
      };
    }

    if (updatePermissionDto.sort === null) {
      updatePermissionDto.sort = 0;
    }

    const blackList = ['pid', 'type', 'name', 'permission', 'disabled'];
    if (
      !Object.keys(updatePermissionDto).some((key) => blackList.includes(key))
    ) {
      await this.prismaService.permission.update({
        where: {
          id,
        },
        data: updatePermissionDto,
      });
      return;
    }

    if (permission.role_names) {
      return {
        statusCode: HttpStatus.NOT_ACCEPTABLE,
        message:
          'The permission has been assigned to the role and cannot be modified',
      };
    }
    if (
      updatePermissionDto.name &&
      permissions.some(
        (item) => item.name === updatePermissionDto.name && item.id !== id,
      )
    ) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'The menu name already exists',
      };
    }
    if (
      updatePermissionDto.permission &&
      permissions.some(
        (item) =>
          item.permission === updatePermissionDto.permission && item.id !== id,
      )
    ) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'The permission identifier already exists',
      };
    }
    if (updatePermissionDto.pid) {
      const parentPermission = permissions.find(
        (item) => item.id === updatePermissionDto.pid,
      );

      if (!parentPermission) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'The parent menu does not exist',
        };
      }
      if (parentPermission.type === 'BUTTON') {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'The parent menu cannot be a button',
        };
      }
    }

    await this.prismaService.permission.update({
      where: {
        id,
      },
      data: updatePermissionDto,
    });
  }

  async remove(id: number) {
    const roleAndPermissions: {
      id: number;
      roles?: string;
      children?: string;
    }[] = await this.prismaService.$queryRaw`
      SELECT p.id, STRING_AGG(DISTINCT r.name, ',') AS roles, STRING_AGG(DISTINCT cp.name, ',') AS children
      FROM permissions p
      LEFT JOIN permissions cp ON p.id = cp.pid AND cp.deleted = false
      LEFT JOIN role_in_permission rp ON p.id = rp.permission_id
      LEFT JOIN roles r ON rp.role_id = r.id AND r.deleted = false
      WHERE p.deleted = false AND p.id = ${id}
      GROUP BY p.id;
    `;

    if (!roleAndPermissions.length) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Permission does not exist',
      };
    }

    if (roleAndPermissions[0].roles) {
      return {
        statusCode: HttpStatus.NOT_ACCEPTABLE,
        message:
          'The permission has been assigned to the role and cannot be deleted',
      };
    }

    if (roleAndPermissions[0].children) {
      return {
        statusCode: HttpStatus.NOT_ACCEPTABLE,
        message: 'The menu has submenus and cannot be deleted',
      };
    }

    await this.prismaService.permission.update({
      where: {
        id,
      },
      data: {
        deleted: true,
      },
    });
  }

  async batchRemove(ids: number[]) {
    const roleAndPermissions: {
      id: number;
      roles?: string;
      children?: string;
    }[] = await this.prismaService.$queryRaw`
      SELECT p.id, STRING_AGG(DISTINCT r.name, ',') AS roles, STRING_AGG(DISTINCT cp.name, ',') AS children
      FROM permissions p
      LEFT JOIN permissions cp ON p.id = cp.pid AND cp.deleted = false
      LEFT JOIN role_in_permission rp ON p.id = rp.permission_id
      LEFT JOIN roles r ON rp.role_id = r.id AND r.deleted = false
      WHERE p.deleted = false AND p.id IN (${Prisma.join(ids)})
      GROUP BY p.id;
    `;

    if (roleAndPermissions.length !== ids.length) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Some permissions do not exist',
      };
    }

    const hasRole = roleAndPermissions.some((item) => item.roles);
    if (hasRole) {
      return {
        statusCode: HttpStatus.NOT_ACCEPTABLE,
        message:
          'Some permissions have been assigned to the role and cannot be deleted',
      };
    }

    const hasChildren = roleAndPermissions.some((item) => item.children);
    if (hasChildren) {
      return {
        statusCode: HttpStatus.NOT_ACCEPTABLE,
        message: 'Some menus have submenus and cannot be deleted',
      };
    }

    await this.prismaService.permission.updateMany({
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

  async findTree(containButton: boolean, containDisabled: boolean) {
    const whereCondition: Prisma.PermissionWhereInput = {
      deleted: false,
    };
    if (!containButton) {
      whereCondition.type = {
        not: 'BUTTON',
      };
    }
    if (!containDisabled) {
      whereCondition.disabled = false;
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
