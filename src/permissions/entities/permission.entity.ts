import { Permission } from '@prisma/client';
import { ApiProperty, OmitType, PickType } from '@nestjs/swagger';

export class PermissionEntity
  implements Omit<Permission, 'deleted' | 'updatedAt'>
{
  @ApiProperty({ description: '菜单ID', type: 'number' })
  id: Permission['id'];

  @ApiProperty({ description: '父级菜单ID', type: 'number', default: null })
  pid: Permission['pid'];

  @ApiProperty({ description: '菜单名称', type: 'string' })
  name: Permission['name'];

  @ApiProperty({ description: '菜单路径', type: 'string' })
  path: Permission['path'];

  @ApiProperty({
    description: '菜单类型',
    enum: ['DIRECTORY', 'MENU', 'BUTTON'],
  })
  type: Permission['type'];

  @ApiProperty({ description: '权限标识', type: 'string' })
  permission: Permission['permission'];

  @ApiProperty({ description: '组件路径', type: 'string' })
  component: Permission['component'];

  @ApiProperty({ description: '菜单图标', type: 'string' })
  icon: Permission['icon'];

  @ApiProperty({ description: '排序', type: 'number' })
  sort: Permission['sort'];

  @ApiProperty({ description: '重定向地址', type: 'string' })
  redirect: string;

  @ApiProperty({ description: '是否隐藏', type: 'boolean', default: false })
  hidden: Permission['hidden'];

  @ApiProperty({ description: '是否缓存', type: 'boolean', default: false })
  cache: boolean;

  @ApiProperty({ description: '是否禁用', type: 'boolean', default: false })
  disabled: boolean;

  @ApiProperty({
    description: 'vue-router的props属性',
    type: 'boolean',
    default: false,
  })
  props: boolean;

  @ApiProperty({ description: '创建时间(UTC)', type: 'string' })
  createdAt: Permission['createdAt'];
}

export class PermissionTreeEntity extends PickType(PermissionEntity, [
  'id',
  'pid',
  'name',
  'type',
] as const) {
  @ApiProperty({
    description: '子菜单',
    required: false,
    default: [],
    type: [PermissionTreeEntity],
  })
  children?: PermissionTreeEntity[];
}

export class PermissionList extends OmitType(PermissionEntity, [
  'redirect',
  'hidden',
  'cache',
  'props',
  'component',
] as const) {
  @ApiProperty({
    description: '子菜单',
    required: false,
    default: [],
    type: [PermissionList],
  })
  children?: PermissionList[];
}

export class PermissionListEntity {
  @ApiProperty({ description: '总数', type: 'number' })
  total: number;

  @ApiProperty({ description: '菜单列表', type: [PermissionList] })
  list: PermissionList[];
}
