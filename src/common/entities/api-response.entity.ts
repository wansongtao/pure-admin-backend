import { ApiProperty } from '@nestjs/swagger';

export class ResponseEntity<T = null> {
  @ApiProperty({ default: 200 })
  code: number;

  @ApiProperty()
  data: T;

  @ApiProperty({ default: 'Success' })
  message: string;
}
