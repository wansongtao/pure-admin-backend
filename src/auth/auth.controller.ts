import { Controller, Get, Ip, Headers, Post, Body, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ApiBaseResponse } from '../common/decorators/api-response.decorator';
import { Public } from '../common/decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { PasswordDto } from './dto/password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import {
  AuthEntity,
  LoginEntity,
  UserInfoEntity,
} from './entities/auth.entity';

import type { IPayload } from '../common/types';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    summary: '获取验证码',
  })
  @ApiBaseResponse(AuthEntity)
  @Public()
  @Get('captcha')
  getCaptcha(
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): AuthEntity {
    return this.authService.generateCaptcha(ip, userAgent);
  }

  @ApiOperation({
    summary: '用户登录',
  })
  @ApiBaseResponse(LoginEntity)
  @Public()
  @Post('login')
  login(
    @Body() { userName, password, captcha }: LoginDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<LoginEntity> {
    return this.authService.login(userName, password, captcha, {
      ip,
      userAgent,
    });
  }

  @ApiOperation({
    summary: '用户登出',
  })
  @ApiBearerAuth()
  @ApiBaseResponse()
  @Post('logout')
  logout(@Headers('authorization') token: string) {
    return this.authService.logout(token.split(' ')[1]);
  }

  @ApiOperation({
    summary: '获取用户权限信息',
  })
  @ApiBearerAuth()
  @ApiBaseResponse(UserInfoEntity)
  @Get('userinfo')
  getUserInfo(@Req() req: { user: IPayload }): Promise<UserInfoEntity> {
    return this.authService.getUserInfo(req.user.userId);
  }

  @ApiOperation({
    summary: '修改密码',
  })
  @ApiBearerAuth()
  @ApiBaseResponse()
  @Post('password')
  updatePassword(
    @Body() passwordDto: PasswordDto,
    @Req() req: { user: IPayload },
  ) {
    return this.authService.updatePassword(passwordDto, req.user.userId);
  }

  @ApiOperation({
    summary: '刷新 token',
  })
  @ApiBearerAuth()
  @ApiBaseResponse(LoginEntity)
  @Public()
  @Post('refresh-token')
  refreshToken(
    @Body() data: RefreshTokenDto,
    @Headers('authorization') token: string,
  ): Promise<LoginEntity> {
    return this.authService.refreshToken(
      data.refreshToken,
      token.split(' ')[1],
    );
  }
}
