import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  StreamableFile,
} from '@nestjs/common';
import { BaseResponseEntity } from '../entities/api-response.entity';
import { throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      map((data) => {
        if (data instanceof Error) {
          throw data;
        }

        if (data instanceof StreamableFile || Buffer.isBuffer(data)) {
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
      catchError((err) => {
        return throwError(() => err);
      }),
    );
  }
}
