import { ApiProperty } from '@nestjs/swagger';
import { Permission } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePermissionDto
  implements
    Partial<Omit<Permission, 'id' | 'deleted' | 'createdAt' | 'updatedAt'>>
{
  @IsNumber({}, { message: '父菜单ID必须为数字' })
  @IsOptional()
  @ApiProperty({
    description: '父级菜单ID',
    type: 'number',
    default: 0,
    required: false,
  })
  pid?: Permission['pid'];

  @Matches(/^[a-zA-Z\u4e00-\u9fa5]{2,16}$/, { message: '菜单名称格式错误' })
  @IsNotEmpty({ message: '菜单名称不能为空' })
  @ApiProperty({ description: '菜单名称', type: 'string' })
  name: Permission['name'];

  @IsEnum(['DIRECTORY', 'MENU', 'BUTTON'], { message: '菜单类型错误' })
  @ApiProperty({
    description: '菜单类型',
    enum: ['DIRECTORY', 'MENU', 'BUTTON'],
  })
  type: Permission['type'];

  @Matches(/^[a-z:]{1,50}$/, { message: '权限标识格式错误' })
  @IsOptional()
  @ApiProperty({ description: '权限标识', type: 'string', required: false })
  permission?: Permission['permission'];

  @MaxLength(50, { message: '菜单图标长度不能超过50' })
  @IsString({ message: '菜单图标必须为字符串' })
  @IsOptional()
  @ApiProperty({ description: '菜单图标', type: 'string', required: false })
  icon?: Permission['icon'];

  @Matches(/^[a-z/:0-9-_]{2,30}$/, { message: '菜单路径格式错误' })
  @IsOptional()
  @ApiProperty({ description: '菜单路径', type: 'string', required: false })
  path?: Permission['path'];

  @Matches(/^\/[a-zA-Z/.]{6,100}$/, { message: '菜单组件地址格式错误' })
  @IsOptional()
  @ApiProperty({ description: '菜单组件地址', type: 'string', required: false })
  component?: Permission['component'];

  @Max(255, { message: '最大255' })
  @Min(0, { message: '最小0' })
  @IsNumber({}, { message: '菜单排序必须为数字' })
  @IsOptional()
  @ApiProperty({
    description: '菜单排序',
    type: 'number',
    required: false,
    default: 0,
  })
  sort?: Permission['sort'];

  @Matches(/^[a-z/:0-9-_]{2,50}$/, { message: '菜单重定向地址格式错误' })
  @IsOptional()
  @ApiProperty({
    description: '菜单重定向地址',
    type: 'string',
    required: false,
  })
  redirect?: Permission['redirect'];

  @IsBoolean({ message: '是否禁用必须为布尔值' })
  @IsOptional()
  @ApiProperty({
    description: '是否禁用',
    type: 'boolean',
    required: false,
    default: false,
  })
  disabled?: Permission['disabled'];

  @IsBoolean({ message: '是否隐藏必须为布尔值' })
  @IsOptional()
  @ApiProperty({
    description: '是否隐藏',
    type: 'boolean',
    required: false,
    default: false,
  })
  hidden?: Permission['hidden'];

  @IsBoolean({ message: '是否缓存必须为布尔值' })
  @IsOptional()
  @ApiProperty({
    description: '是否缓存',
    type: 'boolean',
    required: false,
    default: false,
  })
  cache?: Permission['cache'];

  @IsBoolean({ message: 'router的props属性必须为布尔值' })
  @IsOptional()
  @ApiProperty({
    description: 'router的props属性',
    type: 'boolean',
    required: false,
    default: false,
  })
  props?: Permission['props'];
}
