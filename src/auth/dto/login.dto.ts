import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Matches } from 'class-validator';

export class LoginDto {
  @Matches(/^[a-zA-Z][a-zA-Z0-9]{4,10}$/, { message: '用户名格式错误' })
  @IsNotEmpty({ message: '用户名不能为空' })
  @ApiProperty()
  userName: string;

  @Matches(/^[a-zA-Z](?=.*[.?!&_])(?=.*\d)[a-zA-Z\d.?!&_]{5,15}$/, {
    message: '密码格式错误',
  })
  @IsNotEmpty({ message: '密码不能为空' })
  @ApiProperty()
  password: string;

  @Matches(/^[a-zA-Z0-9]{4}$/, { message: '验证码格式错误' })
  @IsNotEmpty({ message: '验证码不能为空' })
  @ApiProperty({ description: '验证码' })
  captcha: string;
}
