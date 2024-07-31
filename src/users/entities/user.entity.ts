import { User } from '@prisma/client';
import { ProfileEntity } from './profile.entity';
import { ApiProperty, OmitType, PickType } from '@nestjs/swagger';

export class UserEntity implements Omit<User, 'deleted' | 'password'> {
  @ApiProperty({ description: '用户id', type: 'string' })
  id: User['id'];

  @ApiProperty({ description: '用户名', type: 'string' })
  userName: User['userName'];

  @ApiProperty({ description: '是否禁用' })
  disabled: User['disabled'];

  @ApiProperty({ description: '创建时间(UTC)', type: 'string' })
  createdAt: User['createdAt'];

  @ApiProperty({ description: '更新时间(UTC)', type: 'string' })
  updatedAt: User['updatedAt'];
}

export class UserListItem extends UserEntity {
  @ApiProperty({ description: '用户昵称', type: 'string' })
  nickName: ProfileEntity['nickName'];

  @ApiProperty({ description: '用户头像', type: 'string' })
  avatar: ProfileEntity['avatar'];

  @ApiProperty({ description: '角色列表', type: [String] })
  roleNames: string[];
}

export class UserListEntity {
  @ApiProperty({ description: '总数', type: 'number' })
  total: number;

  @ApiProperty({ description: '用户列表', type: [UserListItem] })
  list: UserListItem[];
}

export class UserDetailEntity extends PickType(UserEntity, [
  'userName',
  'disabled',
]) {
  @ApiProperty({ description: '用户昵称', type: 'string', required: false })
  nickName: ProfileEntity['nickName'];

  @ApiProperty({ description: '角色列表', type: [Number], required: false })
  roles: number[];
}

export class UserProfilesEntity extends OmitType(ProfileEntity, ['userId']) {
  @ApiProperty({ description: '用户名', type: 'string' })
  userName: UserEntity['userName'];

  @ApiProperty({ description: '角色列表', type: [String] })
  roles: string[];
}
