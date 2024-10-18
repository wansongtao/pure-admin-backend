import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import getSystemConfig from './common/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ResponseInterceptor } from './common/interceptor/response.interceptor';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AllExceptionsFilter } from './common/filters/all-exception.filter';
import { HttpAdapterHost } from '@nestjs/core';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());

  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  app.useLogger(logger);

  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalPipes(new ValidationPipe());

  app.useGlobalFilters(
    new AllExceptionsFilter(app.get(HttpAdapterHost), logger),
  );

  const systemConfig = getSystemConfig(app.get(ConfigService));

  const prefix = systemConfig.PREFIX;
  app.setGlobalPrefix(prefix);

  const title = systemConfig.SWAGGER_TITLE;
  const description = systemConfig.SWAGGER_DESCRIPTION;
  const version = systemConfig.SWAGGER_VERSION;
  const swaggerConfig = new DocumentBuilder()
    .setTitle(title)
    .setDescription(description)
    .setVersion(version)
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  await app.listen(systemConfig.PORT);
}
bootstrap();
