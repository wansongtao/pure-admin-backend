import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsUrl,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class UpdateProfileDto {
  @Matches(/^[a-zA-Z0-9\u4e00-\u9fa5']{1,50}$/, { message: '昵称格式错误' })
  @ValidateIf((o) => o.nickName !== '')
  @IsOptional()
  @ApiProperty({ description: '用户昵称', type: 'string', required: false })
  nickName?: string;

  @MaxLength(255, { message: '头像地址长度不能超过255个字符' })
  @IsUrl(
    {
      host_whitelist: [
        'localhost',
        /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
      ],
    },
    { message: '头像地址格式错误' },
  )
  @IsOptional()
  @ApiProperty({ description: '头像', type: 'string', required: false })
  avatar?: string;

  @Matches(/^(MA|FE|OT)$/, { message: '性别格式错误' })
  @IsOptional()
  @ApiProperty({
    description: '性别',
    enum: ['MA', 'FE', 'OT'],
    required: false,
  })
  gender?: 'MA' | 'FE' | 'OT';

  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式错误' })
  @IsOptional()
  @ApiProperty({ description: '手机号', type: 'string', required: false })
  phone?: string;

  @IsEmail({}, { message: '邮箱格式错误' })
  @IsOptional()
  @ApiProperty({ description: '邮箱', type: 'string', required: false })
  email?: string;

  @Matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/, {
    message: '生日格式错误',
  })
  @IsOptional()
  @ApiProperty({ description: '生日', type: 'string', required: false })
  birthday?: string;

  @MaxLength(150, { message: '个性签名长度不能超过150个字符' })
  @IsOptional()
  @ApiProperty({ description: '个性签名', type: 'string', required: false })
  description?: string;
}
