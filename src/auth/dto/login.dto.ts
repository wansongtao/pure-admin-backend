import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

export class LoginDto {
  @Matches(/^[a-zA-Z][a-zA-Z0-9]{4,10}$/, { message: '用户名格式错误' })
  @ApiProperty()
  userName: string;

  @Matches(/^[a-zA-Z](?=.*[.?!&_])(?=.*\d)[a-zA-Z\d.?!&_]{5,15}$/, {
    message: '密码格式错误',
  })
  @ApiProperty()
  password: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  @ApiProperty()
  captcha: string;
}
