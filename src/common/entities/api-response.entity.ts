import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export class ResponseEntity<T = null> {
  @ApiProperty({ default: 200 })
  code: HttpStatus;

  @ApiProperty()
  data: T;

  @ApiProperty({ default: 'Success' })
  message: string;
}
