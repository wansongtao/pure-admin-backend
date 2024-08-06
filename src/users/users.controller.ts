import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UsePipes,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { ApiBaseResponse } from '../common/decorators/api-response.decorator';
import { ParseQueryPipe } from '../common/pipe/parse-query.pipe';
import { Permissions } from '../common/decorators/permission.decorator';
import {
  UserListEntity,
  UserDetailEntity,
  UserProfilesEntity,
} from './entities/user.entity';
import { ProfileItemEntity } from './entities/profile.entity';
import { NullResponseEntity } from '../common/entities/api-response.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { DeleteUserDto } from './dto/delete-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ResetUserDto } from './dto/reset-user.dto';

import type { IPayload } from '../common/types';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({
    summary: '创建用户',
  })
  @ApiBaseResponse()
  @Permissions('system:user:add')
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @ApiOperation({
    summary: '获取用户列表',
  })
  @ApiBaseResponse(UserListEntity)
  @Get()
  @UsePipes(
    new ParseQueryPipe<keyof Pick<QueryUserDto, 'disabled' | 'keyword'>>({
      keyword: {
        type: 'string',
        maxLength: 50,
        regexp: /^[a-zA-Z0-9\u4e00-\u9fa5,_-]*$/,
      },
      disabled: { type: 'boolean' },
    }),
  )
  findAll(@Query() query: QueryUserDto): Promise<UserListEntity> {
    return this.usersService.findAll(query);
  }

  @ApiOperation({
    summary: '导出用户列表',
  })
  @ApiBaseResponse(ProfileItemEntity, 'array')
  @Permissions('system:user:export')
  @Get('export')
  exportAll(): Promise<ProfileItemEntity[] | NullResponseEntity> {
    return this.usersService.exportAll();
  }

  @ApiOperation({
    summary: '获取当前用户信息',
  })
  @ApiBaseResponse(UserProfilesEntity)
  @Get('profile')
  findProfile(
    @Req() req: { user: IPayload },
  ): Promise<UserProfilesEntity | NullResponseEntity> {
    return this.usersService.findProfile(req.user.userId);
  }

  @ApiOperation({
    summary: '获取用户详情',
  })
  @ApiBaseResponse(UserDetailEntity)
  @Get(':id')
  findOne(
    @Param('id') id: string,
  ): Promise<UserDetailEntity | NullResponseEntity> {
    return this.usersService.findOne(id);
  }

  @ApiOperation({
    summary: '更新当前用户信息',
  })
  @ApiBaseResponse()
  @Patch('profile')
  updateProfile(
    @Req() req: { user: IPayload },
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(req.user.userId, updateProfileDto);
  }

  @ApiOperation({
    summary: '更新用户',
  })
  @ApiBaseResponse()
  @Permissions('system:user:edit')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @ApiOperation({
    summary: '删除用户',
  })
  @ApiBaseResponse()
  @Permissions('system:user:del')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @ApiOperation({
    summary: '批量删除用户',
  })
  @ApiBaseResponse()
  @Permissions('system:user:del')
  @Post('batch-delete')
  batchRemove(@Body() deleteUserDto: DeleteUserDto) {
    return this.usersService.batchRemove(deleteUserDto.ids);
  }

  @ApiOperation({
    summary: '重置密码',
  })
  @ApiBaseResponse()
  @Permissions('system:user:reset')
  @Post('reset-password')
  resetPassword(@Body() resetUserDto: ResetUserDto) {
    return this.usersService.resetPassword(resetUserDto.id);
  }
}
