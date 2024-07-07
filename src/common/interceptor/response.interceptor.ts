import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  StreamableFile,
} from '@nestjs/common';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { Response } from 'express';
import { ResponseEntity } from '../entities/api-response.entity';

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ResponseEntity<T> | T>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ResponseEntity<T> | T> {
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

        if (data instanceof Error) {
          return {
            code: data?.['status'] ?? 500,
            data: null,
            message: data?.['message'] ?? 'Internal server error',
          };
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
