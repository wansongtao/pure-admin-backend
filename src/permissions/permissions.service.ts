import {
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

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

  findAll() {
    return `This action returns all permissions`;
  }

  findOne(id: number) {
    return `This action returns a #${id} permission`;
  }

  update(id: number, updatePermissionDto: UpdatePermissionDto) {
    return `This action updates a #${id} permission`;
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
}
