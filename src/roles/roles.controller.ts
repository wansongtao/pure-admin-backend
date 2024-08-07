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
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { ParseQueryPipe } from '../common/pipe/parse-query.pipe';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  PickType,
} from '@nestjs/swagger';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { QueryRoleDto } from './dto/query-role.dto';
import { DeleteRoleDto } from './dto/delete-role.dto';
import {
  RoleListEntity,
  RoleDetailEntity,
  RoleEntity,
} from './entities/role.entity';
import { Permissions } from '../common/decorators/permission.decorator';
import { ApiBaseResponse } from '../common/decorators/api-response.decorator';
import { NullResponseEntity } from '../common/entities/api-response.entity';

@ApiTags('roles')
@ApiBearerAuth()
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @ApiOperation({ summary: '创建角色' })
  @ApiBaseResponse()
  @Post()
  @Permissions('system:role:add')
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @ApiOperation({ summary: '获取角色列表' })
  @ApiBaseResponse(RoleListEntity)
  @Get()
  @UsePipes(
    new ParseQueryPipe<keyof Pick<QueryRoleDto, 'disabled' | 'keyword'>>({
      keyword: {
        type: 'string',
        maxLength: 50,
        regexp: /^[a-zA-Z\u4e00-\u9fa5,_-]*$/,
      },
      disabled: { type: 'boolean' },
    }),
  )
  findAll(@Query() query: QueryRoleDto): Promise<RoleListEntity> {
    return this.rolesService.findAll(query);
  }

  @ApiOperation({ summary: '获取所有有效角色' })
  @ApiBaseResponse(PickType(RoleEntity, ['id', 'name']), 'array')
  @Get('tree')
  findValidRoles() {
    return this.rolesService.findValidRoles();
  }

  @ApiOperation({ summary: '获取角色详情' })
  @ApiBaseResponse(RoleDetailEntity)
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<RoleDetailEntity | NullResponseEntity> {
    return this.rolesService.findOne(id);
  }

  @ApiOperation({ summary: '更新角色' })
  @ApiBaseResponse()
  @Patch(':id')
  @Permissions('system:role:edit')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.rolesService.update(id, updateRoleDto);
  }

  @ApiOperation({ summary: '删除角色' })
  @ApiBaseResponse()
  @Delete(':id')
  @Permissions('system:role:del')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.remove(id);
  }

  @ApiOperation({ summary: '批量删除角色' })
  @ApiBaseResponse()
  @Post('batch-delete')
  @Permissions('system:role:del')
  batchRemove(@Body() deleteRoleDto: DeleteRoleDto) {
    return this.rolesService.batchRemove(deleteRoleDto.ids);
  }
}
