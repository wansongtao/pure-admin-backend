import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export class BaseResponseEntity<T = null> {
  @ApiProperty({ default: 200 })
  code: HttpStatus;

  @ApiProperty()
  data: T;

  @ApiProperty({ default: 'Success' })
  message: string;
}

export class NullResponseEntity implements BaseResponseEntity<string> {
  @ApiProperty({ default: 200 })
  code: HttpStatus;

  @ApiProperty({ default: null })
  data: string;

  @ApiProperty({ default: 'Success' })
  message: string;
}
