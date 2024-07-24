import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UsePipes,
  Query,
  ParseIntPipe,
  ParseBoolPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../common/decorators/permission.decorator';
import { ApiBaseResponse } from '../common/decorators/api-response.decorator';
import { ParseQueryPipe } from '../common/pipe/parse-query.pipe';
import {
  PermissionTreeEntity,
  PermissionListEntity,
  PermissionEntity,
} from './entities/permission.entity';
import { QueryPermissionDto } from './dto/query-permission.dto';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { DeletePermissionDto } from './dto/delete-permission.dto';

@ApiTags('permissions')
@ApiBearerAuth()
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @ApiOperation({ summary: '创建权限' })
  @ApiBaseResponse()
  @Permissions('system:menu:add')
  @Post()
  create(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionsService.create(createPermissionDto);
  }

  @ApiOperation({ summary: '获取权限树' })
  @ApiBaseResponse(PermissionTreeEntity, 'array')
  @Get('tree')
  findTree(
    @Query('containButton', new DefaultValuePipe(false), ParseBoolPipe)
    containButton: boolean,
  ): Promise<PermissionTreeEntity[]> {
    return this.permissionsService.findTree(containButton);
  }

  @ApiOperation({ summary: '获取权限列表' })
  @ApiBaseResponse(PermissionListEntity)
  @Get()
  @UsePipes(
    new ParseQueryPipe<
      keyof Pick<QueryPermissionDto, 'disabled' | 'keyword' | 'type'>
    >({
      keyword: {
        type: 'string',
        maxLength: 50,
        regexp: /^[a-zA-Z\u4e00-\u9fa5]*$/,
      },
      disabled: { type: 'boolean' },
      type: { type: 'enum', enum: ['DIRECTORY', 'MENU', 'BUTTON'] },
    }),
  )
  findAll(@Query() query: QueryPermissionDto): Promise<PermissionListEntity> {
    return this.permissionsService.findAll(query);
  }

  @ApiOperation({ summary: '获取单个权限详情' })
  @ApiBaseResponse(PermissionEntity)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.permissionsService.findOne(id);
  }

  @ApiOperation({ summary: '更新权限' })
  @ApiBaseResponse()
  @Permissions('system:menu:edit')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    return this.permissionsService.update(id, updatePermissionDto);
  }

  @ApiOperation({ summary: '删除权限' })
  @ApiBaseResponse()
  @Permissions('system:menu:del')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.permissionsService.remove(id);
  }

  @ApiOperation({ summary: '批量删除权限' })
  @ApiBaseResponse()
  @Permissions('system:menu:del')
  @Post('batch-delete')
  batchRemove(@Body() deletePermissionDto: DeletePermissionDto) {
    return this.permissionsService.batchRemove(deletePermissionDto.ids);
  }
}
