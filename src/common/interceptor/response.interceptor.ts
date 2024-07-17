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
import { BaseResponseEntity } from '../entities/api-response.entity';

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, BaseResponseEntity<T> | T>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<BaseResponseEntity<T> | T> {
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

        const result: BaseResponseEntity<T> = {
          statusCode: 200,
          data: data ?? null,
          message: 'Success',
        };

        if (data?.statusCode || data?.message) {
          result.statusCode = data?.statusCode ?? 200;
          result.message = data?.message ?? 'Success';
          result.data = data?.data ?? null;
        }

        return result;
      }),
    );
  }
}
