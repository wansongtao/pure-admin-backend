import { IsString, ArrayNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeleteUserDto {
  @IsString({ message: 'id必须为字符串', each: true })
  @ArrayNotEmpty({ message: 'ids不能为空' })
  @ApiProperty({ description: '用户id列表' })
  ids: string[];
}
