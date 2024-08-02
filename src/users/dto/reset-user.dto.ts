import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetUserDto {
  @IsString({ message: 'id必须为字符串' })
  @IsNotEmpty({ message: 'id不能为空' })
  @ApiProperty({ description: '用户id' })
  id: string;
}
