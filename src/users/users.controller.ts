import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  ParseBoolPipe,
  ParseEnumPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { ApiBaseResponse } from '../common/decorators/api-response.decorator';
import { ParseDatePipe } from '../common/pipe/parse-date.pipe';
import { ParseStringPipe } from '../common/pipe/parse-string.pipe';
import { UserEntity } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { DeleteUserDto } from './dto/delete-user.dto';
import { Permissions } from '../common/decorators/permission.decorator';

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
  @ApiQuery({ type: QueryUserDto, required: false })
  @ApiBaseResponse(UserEntity, 'array')
  @Get()
  findAll(
    @Query(
      'page',
      new DefaultValuePipe(1),
      new ParseIntPipe({ optional: true }),
    )
    page?: QueryUserDto['page'],
    @Query(
      'pageSize',
      new DefaultValuePipe(10),
      new ParseIntPipe({ optional: true }),
    )
    pageSize?: QueryUserDto['pageSize'],
    @Query('beginTime', new ParseDatePipe({ optional: true }))
    beginTime?: QueryUserDto['beginTime'],
    @Query('endTime', new ParseDatePipe({ optional: true }))
    endTime?: QueryUserDto['endTime'],
    @Query(
      'sort',
      new DefaultValuePipe('desc'),
      new ParseEnumPipe(['asc', 'desc'], { optional: true }),
    )
    sort?: QueryUserDto['sort'],
    @Query('disabled', new ParseBoolPipe({ optional: true }))
    disabled?: QueryUserDto['disabled'],
    @Query('keyword', new ParseStringPipe({ optional: true, maxLength: 50 }))
    keyword?: QueryUserDto['keyword'],
  ): Promise<UserEntity[]> {
    return this.usersService.findAll({
      page,
      pageSize,
      beginTime,
      endTime,
      sort,
      disabled,
      keyword,
    });
  }

  @ApiOperation({
    summary: '获取用户详情',
  })
  @ApiBaseResponse(UserEntity)
  @Get(':id')
  findOne(@Param('id') id: string): Promise<UserEntity> {
    return this.usersService.findOne(id);
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
}
