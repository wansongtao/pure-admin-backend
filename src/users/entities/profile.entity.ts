import { Profile } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class ProfileEntity
  implements Omit<Profile, 'id' | 'createdAt' | 'updatedAt'>
{
  @ApiProperty({ description: '用户id', type: 'string' })
  userId: Profile['userId'];

  @ApiProperty({ description: '用户昵称', type: 'string' })
  nickName: Profile['nickName'];

  @ApiProperty({ description: '用户头像', type: 'string' })
  avatar: Profile['avatar'];

  @ApiProperty({ description: '用户邮箱', type: 'string' })
  email: Profile['email'];

  @ApiProperty({ description: '用户手机号', type: 'string' })
  phone: Profile['phone'];

  @ApiProperty({ description: '用户性别', enum: ['MA', 'FE'] })
  gender: Profile['gender'];

  @ApiProperty({ description: '用户生日(UTC)', type: 'string' })
  birthday: Profile['birthday'];

  @ApiProperty({ description: '用户描述', type: 'string' })
  description: Profile['description'];
}
