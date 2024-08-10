import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { Inject } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { BaseResponseEntity } from '../entities/api-response.entity';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      httpStatus = exception.getStatus();

      const res = exception.getResponse() as { message: string[] };
      message = res?.message?.join ? res?.message[0] : exception.message;
      this.handleHttpException(exception, httpStatus);
    } else if (
      exception instanceof Prisma.PrismaClientKnownRequestError ||
      exception instanceof Prisma.PrismaClientUnknownRequestError
    ) {
      message = exception.message;
      this.handlePrismaException(exception);
    } else if (exception instanceof Error) {
      this.handleGenericError(exception);
    } else {
      this.handleUnknownError(exception);
    }

    const responseBody: BaseResponseEntity = {
      statusCode: httpStatus,
      data: null,
      message: message,
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }

  private handleHttpException(exception: HttpException, status: number): void {
    this.logger.error(`HTTP Exception: ${exception.message}`, {
      status,
      stack: exception.stack,
    });
  }

  private handlePrismaException(
    exception:
      | Prisma.PrismaClientKnownRequestError
      | Prisma.PrismaClientUnknownRequestError,
  ): void {
    if (exception instanceof Prisma.PrismaClientUnknownRequestError) {
      this.logger.error(`Prisma Unknown Exception: ${exception.message}`, {
        stack: exception.stack,
      });
      return;
    }

    this.logger.error(`Prisma Exception: ${exception.message}`, {
      code: exception.code,
      meta: exception.meta,
      stack: exception.stack,
    });
  }

  private handleGenericError(exception: Error): void {
    this.logger.error(`Unhandled Exception: ${exception.message}`, {
      stack: exception.stack,
    });
  }

  private handleUnknownError(exception: unknown): void {
    this.logger.error('Unknown error', { exception });
  }
}
