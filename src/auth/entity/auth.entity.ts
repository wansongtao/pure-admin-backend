import { ApiProperty } from '@nestjs/swagger';

export class AuthEntity {
  @ApiProperty({
    description: 'base64 格式验证码',
    default: 'data:image/svg+xml;base64,***',
  })
  captcha: string;
}

export class LoginEntity {
  @ApiProperty({ description: 'token' })
  token: string;
}
