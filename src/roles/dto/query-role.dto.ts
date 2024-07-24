import { ApiProperty } from '@nestjs/swagger';
import { BaseQueryDto } from '../../common/dto/base-query.dto';

export class QueryRoleDto extends BaseQueryDto {
  @ApiProperty({ required: false })
  disabled?: boolean;

  @ApiProperty({
    required: false,
    description: '名称关键字, 不能超过50个字符',
  })
  keyword?: string;
}
