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
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreatePermissionDto {
  @IsNumber({}, { message: '父菜单ID必须为数字' })
  @ValidateIf((o) => o.pid !== undefined)
  @IsOptional()
  @ApiProperty({
    description: '父级菜单ID',
    type: 'number',
    default: null,
    required: false,
  })
  pid?: number;

  @Matches(/^[a-zA-Z\u4e00-\u9fa5]{1,50}$/, { message: '菜单名称格式错误' })
  @IsNotEmpty({ message: '菜单名称不能为空' })
  @ApiProperty({ description: '菜单名称', type: 'string' })
  name: string;

  @IsEnum(['DIRECTORY', 'MENU', 'BUTTON'], { message: '菜单类型错误' })
  @ApiProperty({
    description: '菜单类型',
    enum: ['DIRECTORY', 'MENU', 'BUTTON'],
  })
  type: Permission['type'];

  @Matches(/^[a-z:]{1,50}$/, { message: '权限标识格式错误' })
  @ValidateIf((o) => o.permission !== '')
  @IsOptional()
  @ApiProperty({ description: '权限标识', type: 'string', required: false })
  permission?: string;

  @MaxLength(50, { message: '菜单图标长度不能超过50' })
  @IsString({ message: '菜单图标必须为字符串' })
  @ValidateIf((o) => o.icon !== '')
  @IsOptional()
  @ApiProperty({ description: '菜单图标', type: 'string', required: false })
  icon?: string;

  @MinLength(2, { message: '菜单路径长度不能小于2' })
  @MaxLength(50, { message: '菜单路径长度不能超过50' })
  @Matches(/^\/?([a-zA-Z]+)(\/[a-zA-Z]+|\/:[a-zA-Z]+)*$/, {
    message: '菜单路径格式错误',
  })
  @IsOptional()
  @ApiProperty({ description: '菜单路径', type: 'string', required: false })
  path?: string;

  @MinLength(6, { message: '菜单组件地址长度不能小于6' })
  @MaxLength(100, { message: '菜单组件地址长度不能超过100' })
  @Matches(/^(\/[a-zA-Z]+[-_]?[a-zA-Z]+)+(.vue|.tsx|.jsx)$/, {
    message: '菜单组件地址格式错误',
  })
  @ValidateIf((o) => o.component !== '')
  @IsOptional()
  @ApiProperty({ description: '菜单组件地址', type: 'string', required: false })
  component?: string;

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
  sort?: number;

  @MinLength(2, { message: '菜单重定向地址长度不能小于2' })
  @MaxLength(50, { message: '菜单重定向地址长度不能超过50' })
  @Matches(/^(\/?[a-zA-Z0-9]+)+$/, { message: '菜单重定向地址格式错误' })
  @ValidateIf((o) => o.redirect !== '')
  @IsOptional()
  @ApiProperty({
    description: '菜单重定向地址',
    type: 'string',
    required: false,
  })
  redirect?: string;

  @IsBoolean({ message: '是否禁用必须为布尔值' })
  @IsOptional()
  @ApiProperty({
    description: '是否禁用',
    type: 'boolean',
    required: false,
    default: false,
  })
  disabled?: boolean;

  @IsBoolean({ message: '是否隐藏必须为布尔值' })
  @IsOptional()
  @ApiProperty({
    description: '是否隐藏',
    type: 'boolean',
    required: false,
    default: false,
  })
  hidden?: boolean;

  @IsBoolean({ message: '是否缓存必须为布尔值' })
  @IsOptional()
  @ApiProperty({
    description: '是否缓存',
    type: 'boolean',
    required: false,
    default: false,
  })
  cache?: boolean;

  @IsBoolean({ message: 'vue-router的props属性必须为布尔值' })
  @IsOptional()
  @ApiProperty({
    description: 'vue-router的props属性',
    type: 'boolean',
    required: false,
    default: false,
  })
  props?: boolean;
}
