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
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { ParseQueryPipe } from '../common/pipe/parse-query.pipe';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { QueryRoleDto } from './dto/query-role.dto';
import { RoleListEntity } from './entities/role.entity';
import { ApiBaseResponse } from 'src/common/decorators/api-response.decorator';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('roles')
@ApiBearerAuth()
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @ApiOperation({ summary: '创建角色' })
  @ApiBaseResponse()
  @Post()
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

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.update(+id, updateRoleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rolesService.remove(+id);
  }
}
