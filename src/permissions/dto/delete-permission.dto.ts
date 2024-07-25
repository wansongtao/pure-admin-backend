import { ArrayNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeletePermissionDto {
  @IsNumber({}, { message: 'id必须为数字', each: true })
  @ArrayNotEmpty({ message: 'ids不能为空' })
  @ApiProperty({ description: 'id列表', type: [Number] })
  ids: number[];
}
