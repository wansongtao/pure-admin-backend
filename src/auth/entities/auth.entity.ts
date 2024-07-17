import { ApiProperty } from '@nestjs/swagger';
import { User, Profile, Role, Permission } from '@prisma/client';

export class AuthEntity {
  @ApiProperty({
    description: 'base64 格式验证码',
    default: 'data:image/svg+xml;base64,***',
  })
  captcha: string;
}

export class LoginEntity {
  @ApiProperty({ description: 'token' })
  token: string;
}

class MenuEntity
  implements
    Omit<
      Permission,
      | 'createdAt'
      | 'updatedAt'
      | 'deleted'
      | 'deletedAt'
      | 'disabled'
      | 'permission'
      | 'sort'
    >
{
  @ApiProperty({ description: '菜单 ID', type: 'number' })
  id: Permission['id'];

  @ApiProperty({ description: '父级菜单 ID', type: 'number' })
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

  @ApiProperty({ description: '菜单组件路径', type: 'string' })
  component: Permission['component'];

  @ApiProperty({ description: '是否缓存', type: 'boolean' })
  cache: Permission['cache'];

  @ApiProperty({ description: '是否隐藏', type: 'boolean' })
  hidden: Permission['hidden'];

  @ApiProperty({ description: '菜单图标', type: 'string' })
  icon: Permission['icon'];

  @ApiProperty({ description: '重定向地址', type: 'string' })
  redirect: Permission['redirect'];

  @ApiProperty({ description: '菜单属性', type: 'boolean' })
  props: Permission['props'];

  @ApiProperty({
    description: '子菜单',
    required: false,
    default: [],
  })
  children?: MenuEntity[];
}

export class UserInfoEntity {
  @ApiProperty({ description: '用户昵称', type: 'string' })
  name: Profile['nickName'] | User['userName'];

  @ApiProperty({ description: '用户头像', type: 'string', required: false })
  avatar?: Profile['avatar'];

  @ApiProperty({
    description: '用户角色',
    type: 'array',
    items: { type: 'string' },
    required: false,
  })
  roles?: Role['name'][];

  @ApiProperty({
    description: '用户权限',
    type: 'array',
    items: { type: 'string' },
    required: false,
  })
  permissions?: Permission['permission'][];

  @ApiProperty({
    description: '用户可访问菜单表',
    type: () => [MenuEntity],
    required: false,
  })
  menus?: MenuEntity[];
}
