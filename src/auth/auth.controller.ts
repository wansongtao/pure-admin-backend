import { Controller, Get, Ip, Headers, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { AuthEntity } from './entity/auth.entity';
import { ApiResponse } from 'src/common/decorators/api-response.decorator';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Get('captcha')
  @ApiResponse(AuthEntity)
  getCaptcha(@Ip() ip: string, @Headers('user-agent') userAgent: string) {
    return this.authService.generateCaptcha(ip, userAgent);
  }

  @Public()
  @Post('login')
  @ApiResponse(AuthEntity)
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
}
