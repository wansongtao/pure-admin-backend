import { ApiProperty } from '@nestjs/swagger';
import { BaseQueryDto } from '../../common/dto/base-query.dto';

export class QueryUserDto extends BaseQueryDto {
  @ApiProperty({ required: false })
  disabled?: boolean;

  @ApiProperty({
    required: false,
    description: '用户名或用户昵称关键字, 不能超过50个字符',
  })
  keyword?: string;
}
