import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { QueryRoleDto } from './dto/query-role.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class RolesService {
  constructor(private readonly prismaService: PrismaService) {}

  create(createRoleDto: CreateRoleDto) {
    return 'This action adds a new role';
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

  findOne(id: number) {
    return `This action returns a #${id} role`;
  }

  update(id: number, updateRoleDto: UpdateRoleDto) {
    return `This action updates a #${id} role`;
  }

  remove(id: number) {
    return `This action removes a #${id} role`;
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
}
