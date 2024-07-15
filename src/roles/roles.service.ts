import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(private readonly prismaService: PrismaService) {}

  create(createRoleDto: CreateRoleDto) {
    return 'This action adds a new role';
  }

  findAll() {
    return `This action returns all roles`;
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
