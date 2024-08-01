import { Controller, Get, Query } from '@nestjs/common';
import { UploadService } from './upload.service';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { ApiBaseResponse } from '../common/decorators/api-response.decorator';

@ApiTags('upload')
@ApiBearerAuth()
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @ApiOperation({ summary: '获取预签名 URL' })
  @ApiQuery({ name: 'filename', type: 'string', description: '文件名' })
  @ApiBaseResponse()
  @Get('presigned')
  presignedUrl(@Query('filename') fileName: string) {
    return this.uploadService.presignedUrl(fileName);
  }
}
