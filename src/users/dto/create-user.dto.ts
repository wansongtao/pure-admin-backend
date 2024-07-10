import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  Matches,
  IsBoolean,
  IsEmpty,
  MaxLength,
} from 'class-validator';

export class CreateUserDto {
  @Matches(/^[a-zA-Z][a-zA-Z0-9]{4,10}$/, { message: '用户名格式错误' })
  @IsNotEmpty({ message: '用户名不能为空' })
  @ApiProperty()
  userName: string;

  @Matches(/^[a-zA-Z\u4e00-\u9fa5']{1,50}$/, { message: '昵称格式错误' })
  @IsEmpty()
  @ApiProperty({ required: false, default: '' })
  nickName?: string;

  @IsBoolean({ message: '禁用状态必须为布尔值' })
  @IsEmpty()
  @ApiProperty({ required: false, default: false })
  disabled?: boolean;

  @MaxLength(255, { message: '头像url长度不能超过255' })
  @IsEmpty()
  @ApiProperty({ required: false, default: '' })
  avatar?: string;

  @IsEmpty()
  @ApiProperty({ required: false, description: '角色id列表', default: null })
  roles?: string[];
}
