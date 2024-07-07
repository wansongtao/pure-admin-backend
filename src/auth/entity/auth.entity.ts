import { ApiProperty } from '@nestjs/swagger';

export class AuthEntity {
  @ApiProperty()
  data: string;
}
