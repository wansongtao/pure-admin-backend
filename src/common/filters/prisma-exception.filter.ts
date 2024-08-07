import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';
import { BaseResponseEntity } from '../entities/api-response.entity';

@Catch(
  Prisma.PrismaClientKnownRequestError,
  Prisma.PrismaClientUnknownRequestError,
)
export class PrismaClientExceptionFilter implements ExceptionFilter {
  catch(
    exception:
      | Prisma.PrismaClientKnownRequestError
      | Prisma.PrismaClientUnknownRequestError,
    host: ArgumentsHost,
  ) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const result: BaseResponseEntity<null> = {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      data: null,
      message: 'Internal server error',
    };

    if (exception instanceof Prisma.PrismaClientUnknownRequestError) {
      result.statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      result.message = exception.message;
      return response.status(result.statusCode).json(result);
    }

    switch (exception.code) {
      case 'P2002':
        result.statusCode = HttpStatus.CONFLICT;
        result.message = `Unique constraint failed on the fields: ${exception.meta?.target}`;
        return response.status(result.statusCode).json(result);
      case 'P2025':
        result.statusCode = HttpStatus.NOT_FOUND;
        result.message = 'Record to update not found';
        return response.status(result.statusCode).json(result);
      default:
        result.statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        result.message = exception.message;
        return response.status(result.statusCode).json(result);
    }
  }
}
