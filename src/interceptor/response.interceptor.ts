import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  StreamableFile,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { Response } from 'express';
import type { ApiResponse } from '../interfaces/api-response.interface';

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T> | T>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T> | T> {
    return next.handle().pipe(
      map((data) => {
        // 检查是否为二进制数据或流
        if (data instanceof StreamableFile || Buffer.isBuffer(data)) {
          return data;
        }

        const response = context.switchToHttp().getResponse<Response>();
        // 检查响应头是否已设置为非JSON类型
        const contentType = response.getHeader('Content-Type');
        if (contentType && contentType !== 'application/json') {
          return data;
        }

        return {
          code: data?.code ?? response.statusCode,
          data,
          message: data?.message ?? 'Success',
        };
      }),
    );
  }
}
