import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  Matches,
  IsBoolean,
  IsNumber,
  IsOptional,
  ArrayNotEmpty,
  ValidateIf,
} from 'class-validator';

export class CreateUserDto {
  @Matches(/^[a-zA-Z][a-zA-Z0-9]{2,10}$/, { message: '用户名格式错误' })
  @IsNotEmpty({ message: '用户名不能为空' })
  @ApiProperty({ description: '用户名', type: 'string' })
  userName: string;

  @Matches(/^[a-zA-Z0-9\u4e00-\u9fa5']{1,50}$/, { message: '昵称格式错误' })
  @ValidateIf((o) => o.nickName !== '')
  @IsOptional()
  @ApiProperty({ description: '用户昵称', type: 'string', required: false })
  nickName?: string;

  @IsBoolean({ message: '禁用状态必须为布尔值' })
  @IsOptional()
  @ApiProperty({ type: 'boolean', required: false, default: false })
  disabled?: boolean;

  @IsNumber({}, { message: '角色id列表必须为数字数组', each: true })
  @ArrayNotEmpty({ message: '角色id列表不能为空' })
  @ValidateIf((o) => o.roles?.length !== 0)
  @IsOptional()
  @ApiProperty({
    description: '角色id列表',
    type: [Number],
    required: false,
  })
  roles?: number[];
}
