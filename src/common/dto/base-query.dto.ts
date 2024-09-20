import { ApiProperty } from '@nestjs/swagger';

export class BaseQueryDto {
  @ApiProperty({ required: false, default: 1 })
  page: number;

  @ApiProperty({ required: false, default: 10 })
  pageSize: number;

  @ApiProperty({
    required: false,
    description: '开始时间(unix时间戳、一个有效的时间字符串)',
  })
  beginTime?: string;

  @ApiProperty({ required: false })
  endTime?: string;

  @ApiProperty({
    required: false,
    default: 'desc',
    enum: ['asc', 'desc'],
    description: '排序方式，默认按创建时间倒序排列',
  })
  sort?: 'asc' | 'desc' = 'desc';
}
