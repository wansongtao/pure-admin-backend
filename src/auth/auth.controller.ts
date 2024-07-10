import { Controller, Get, Ip, Headers, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { AuthEntity, LoginEntity } from './entities/auth.entity';
import { ApiBaseResponse } from 'src/common/decorators/api-response.decorator';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Get('captcha')
  @ApiOperation({
    summary: '获取验证码',
  })
  @ApiBaseResponse(AuthEntity)
  getCaptcha(@Ip() ip: string, @Headers('user-agent') userAgent: string) {
    return this.authService.generateCaptcha(ip, userAgent);
  }

  @Public()
  @Post('login')
  @ApiOperation({
    summary: '用户登录',
  })
  @ApiBody({ type: LoginDto })
  @ApiBaseResponse(LoginEntity)
  login(
    @Body() { userName, password, captcha }: LoginDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.authService.login(userName, password, captcha, {
      ip,
      userAgent,
    });
  }

  @Get('logout')
  @ApiOperation({
    summary: '用户登出',
  })
  @ApiBaseResponse()
  logout(@Headers('authorization') token: string) {
    return this.authService.logout(token.split(' ')[1]);
  }
}
