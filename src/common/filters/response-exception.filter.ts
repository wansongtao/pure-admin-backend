import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';
import { BaseResponseEntity } from '../entities/api-response.entity';

@Catch(HttpException)
export class ResponseExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    const statusCode = exception.getStatus();
    const res = exception.getResponse() as { message: string[] };

    const data: BaseResponseEntity<null> = {
      code: statusCode,
      data: null,
      message: res?.message?.join ? res?.message[0] : exception.message,
    };
    response.status(statusCode).json(data);
  }
}
