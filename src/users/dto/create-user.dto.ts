import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty()
  userName: string;

  @ApiProperty()
  password: string;

  @ApiProperty({ required: false })
  disabled?: boolean;

  @ApiProperty({ required: false })
  deleted?: boolean;
}
