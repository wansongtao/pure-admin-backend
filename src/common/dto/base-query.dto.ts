import { ApiProperty } from '@nestjs/swagger';

export class BaseQueryDto {
  @ApiProperty({ required: false, default: 1 })
  page: number;

  @ApiProperty({ required: false, default: 10 })
  pageSize: number;

  @ApiProperty({ required: false, description: '请传入 UTC 时间' })
  beginTime?: Date;

  @ApiProperty({ required: false, description: '请传入 UTC 时间' })
  endTime?: Date;

  @ApiProperty({
    required: false,
    default: 'desc',
    enum: ['asc', 'desc'],
    description: '排序方式，默认按创建时间倒序排列',
  })
  sort?: 'asc' | 'desc' = 'desc';
}
