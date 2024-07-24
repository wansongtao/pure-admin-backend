import { Role } from '@prisma/client';
import { ApiProperty, OmitType } from '@nestjs/swagger';

export class RoleEntity implements Omit<Role, 'deleted'> {
  @ApiProperty({ description: '角色ID', type: 'number' })
  id: Role['id'];

  @ApiProperty({ description: '角色名称', type: 'string' })
  name: Role['name'];

  @ApiProperty({ description: '角色描述', type: 'string' })
  description: Role['description'];

  @ApiProperty({ description: '是否禁用', type: 'boolean' })
  disabled: Role['disabled'];

  @ApiProperty({ description: '创建时间(UTC)', type: 'string' })
  createdAt: Role['createdAt'];

  @ApiProperty({ description: '更新时间(UTC)', type: 'string' })
  updatedAt: Role['updatedAt'];
}

export class RoleListEntity {
  @ApiProperty({ description: '总数', type: 'number' })
  total: number;

  @ApiProperty({ description: '角色列表', type: [RoleEntity] })
  list: RoleEntity[];
}

export class RoleDetailEntity extends OmitType(RoleEntity, [
  'createdAt',
  'updatedAt',
]) {
  @ApiProperty({ description: '权限列表', type: 'number', isArray: true })
  permissions: number[];
}
