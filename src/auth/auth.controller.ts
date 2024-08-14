import {
  Controller,
  Get,
  Ip,
  Headers,
  Post,
  Body,
  Req,
  Query,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ApiBaseResponse } from '../common/decorators/api-response.decorator';
import { Public } from '../common/decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { PasswordDto } from './dto/password.dto';
import {
  AuthEntity,
  LoginEntity,
  UserInfoEntity,
} from './entities/auth.entity';
import {
  BaseResponseEntity,
  NullResponseEntity,
} from '../common/entities/api-response.entity';

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
  ): Promise<LoginEntity | BaseResponseEntity> {
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
  @Get('logout')
  logout(@Headers('authorization') token: string) {
    return this.authService.logout(token.split(' ')[1]);
  }

  @ApiOperation({
    summary: '获取用户权限信息',
  })
  @ApiBearerAuth()
  @ApiBaseResponse(UserInfoEntity)
  @Get('userinfo')
  getUserInfo(
    @Req() req: { user: IPayload },
  ): Promise<UserInfoEntity | NullResponseEntity> {
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
  @Get('refresh_token')
  refreshToken(
    @Query('refreshToken') refreshToken: string,
    @Headers('authorization') token: string,
  ): Promise<LoginEntity> {
    return this.authService.refreshToken(refreshToken, token.split(' ')[1]);
  }
}
