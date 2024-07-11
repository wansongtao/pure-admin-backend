import { User, RoleInUser, Profile } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class UserEntity
  implements Pick<User, 'id' | 'userName' | 'disabled' | 'createdAt'>
{
  @ApiProperty({ description: '用户id' })
  id: string;

  @ApiProperty({ description: '用户名' })
  userName: string;

  @ApiProperty({ description: '是否禁用', default: false })
  disabled: boolean;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '用户角色', type: [Number], required: false })
  roles?: RoleInUser['roleId'][];

  @ApiProperty({ description: '用户昵称', type: 'string', required: false })
  nickName?: Profile['nickName'];

  @ApiProperty({ description: '用户头像', type: 'string', required: false })
  avatar?: Profile['avatar'];

  @ApiProperty({ description: '用户邮箱', type: 'string', required: false })
  email?: Profile['email'];

  @ApiProperty({ description: '用户手机号', type: 'string', required: false })
  phone?: Profile['phone'];

  @ApiProperty({
    description: '用户性别',
    enum: ['MA', 'FE'],
    required: false,
  })
  gender?: Profile['gender'];

  @ApiProperty({ description: '用户生日', type: Date, required: false })
  birthday?: Profile['birthday'];

  @ApiProperty({ description: '用户描述', type: 'string', required: false })
  description?: Profile['description'];
}
