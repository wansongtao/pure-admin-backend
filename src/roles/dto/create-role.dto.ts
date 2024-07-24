import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class CreateRoleDto {
  @Matches(/^[a-zA-Z0-9._-]{1,50}$/, { message: '名称格式错误' })
  @IsNotEmpty({ message: '名称不能为空' })
  @ApiProperty({ description: '角色名称', type: 'string' })
  name: string;

  @MaxLength(150, { message: '描述不能超过150个字符' })
  @ValidateIf((o) => o.description !== '')
  @IsOptional()
  @ApiProperty({ description: '角色描述', type: 'string', required: false })
  description?: string;

  @IsNumber({}, { message: '权限id必须为数字', each: true })
  @ArrayNotEmpty({ message: '权限列表不能为空' })
  @ValidateIf((o) => o.permissions !== null)
  @IsOptional()
  @ApiProperty({ description: '权限ID列表', type: [Number], required: false })
  permissions?: number[];

  @IsBoolean({ message: '是否禁用必须为布尔值' })
  @IsOptional()
  @ApiProperty({ description: '是否禁用', type: 'boolean', required: false })
  disabled?: boolean;
}
