import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @IsString({ message: 'refreshToken 必须是字符串' })
  @IsNotEmpty({ message: 'refreshToken 不能为空' })
  @ApiProperty({ description: '刷新令牌' })
  refreshToken: string;
}
